import { createClient } from '@/lib/supabase/client';
import { DEMO_LISTINGS } from '@/lib/demo/data';

// =====================================================
// ScrapLens — Listings (Lotes) Service
//
// Same rule as scraps/service.js: a real, authenticated account is backed
// by Supabase ONLY. An empty result means that account genuinely has no
// lots yet — it must never fall back to the shared localStorage bucket or
// DEMO_LISTINGS. Only a session with no authenticated user (demo / no
// backend configured) uses localStorage.
// =====================================================

const STORAGE_KEY = 'scraplens_user_listings_v1';

// createClient() throws SYNCHRONOUSLY (not a rejected promise) when
// Supabase isn't configured — with no backend, there's nothing to check
// a session against, so treat that exactly like "no user".
function getSupabaseClientSafe() {
  try {
    return createClient();
  } catch (err) {
    console.warn('[listings] Supabase client unavailable (not configured):', err);
    return null;
  }
}

async function getCurrentUser() {
  const supabase = getSupabaseClientSafe();
  if (!supabase) return { supabase: null, user: null };
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
  } catch (err) {
    console.warn('[listings] Supabase auth check failed:', err);
    return { supabase, user: null };
  }
}

export async function getListings() {
  const { supabase, user } = await getCurrentUser();

  if (user) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, listing_scraps(scrap_id, scraps(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((listing) => ({
        ...listing,
        scraps: (listing.listing_scraps ?? []).map((ls) => ls.scraps).filter(Boolean),
      }));
    } catch (err) {
      console.error('[listings] Supabase fetch failed for authenticated user:', err);
      // Fail closed: never show demo/local data to a real account.
      return [];
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_LISTINGS));
      return DEMO_LISTINGS;
    } catch {
      return DEMO_LISTINGS;
    }
  }

  return DEMO_LISTINGS;
}

export async function createListing(listing) {
  const { supabase, user } = await getCurrentUser();

  if (user) {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title: listing.title,
        description: listing.description ?? '',
        total_value: listing.total_value ?? 0,
        total_weight_kg: listing.total_weight_kg ?? 0,
        status: listing.status ?? 'draft',
        is_demo: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[listings] Supabase insert error:', error);
      throw error;
    }

    const scrapIds = (listing.scraps ?? []).map((s) => s.id).filter(Boolean);
    if (scrapIds.length > 0) {
      const { error: linkError } = await supabase
        .from('listing_scraps')
        .insert(scrapIds.map((scrap_id) => ({ listing_id: data.id, scrap_id })));
      if (linkError) console.error('[listings] Supabase listing_scraps link error:', linkError);
    }

    return { ...data, scraps: listing.scraps ?? [] };
  }

  // Demo / unauthenticated: localStorage only.
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const newListing = {
    id: `lot-${randomSuffix}-${Date.now()}`,
    user_id: 'local-user',
    title: listing.title,
    description: listing.description ?? '',
    total_value: listing.total_value ?? 0,
    total_weight_kg: listing.total_weight_kg ?? 0,
    status: listing.status ?? 'draft',
    share_token: `share-${randomSuffix}`,
    is_demo: true,
    created_at: timestamp,
    updated_at: timestamp,
    scraps: listing.scraps ?? [],
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [...DEMO_LISTINGS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newListing, ...existing]));
    } catch (e) {
      console.warn('[listings] LocalStorage save error:', e);
    }
  }

  return newListing;
}

export async function removeListing(id) {
  const { supabase, user } = await getCurrentUser();

  if (user) {
    const { error } = await supabase.from('listings').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      console.error('[listings] Supabase delete error:', error);
      throw error;
    }
    return;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing = JSON.parse(stored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((l) => l.id !== id)));
      }
    } catch (e) {
      console.warn('[listings] LocalStorage delete error:', e);
    }
  }
}

export async function updateListingStatus(id, status) {
  const { supabase, user } = await getCurrentUser();
  const timestamp = new Date().toISOString();

  if (user) {
    const { error } = await supabase
      .from('listings')
      .update({ status, updated_at: timestamp })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[listings] Supabase update error:', error);
      throw error;
    }
    return;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing = JSON.parse(stored);
        const updated = existing.map((l) => (l.id === id ? { ...l, status, updated_at: timestamp } : l));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[listings] LocalStorage update error:', e);
    }
  }
}
