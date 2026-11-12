import { createClient } from '@/lib/supabase/client';
import { DEMO_LISTINGS } from '@/lib/demo/data';

// =====================================================
// ScrapLens — Listings (Lotes) Service
// Mirrors scraps/service.js: Supabase when authenticated,
// localStorage fallback otherwise. Fixes the bug where
// created lots only lived in React state and disappeared
// on reload.
// =====================================================

const STORAGE_KEY = 'scraplens_user_listings_v1';

export async function getListings() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('listings')
        .select('*, listing_scraps(scrap_id, scraps(*))')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((listing) => ({
          ...listing,
          scraps: (listing.listing_scraps ?? []).map((ls) => ls.scraps).filter(Boolean),
        }));
      }
    }
  } catch (err) {
    console.warn('[listings] Supabase fetch fallback to local:', err);
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

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: newListing.title,
          description: newListing.description,
          total_value: newListing.total_value,
          total_weight_kg: newListing.total_weight_kg,
          status: newListing.status,
          is_demo: false,
        })
        .select()
        .single();

      if (!error && data) {
        const scrapIds = (listing.scraps ?? []).map((s) => s.id).filter(Boolean);
        if (scrapIds.length > 0) {
          await supabase
            .from('listing_scraps')
            .insert(scrapIds.map((scrap_id) => ({ listing_id: data.id, scrap_id })));
        }
        return { ...data, scraps: listing.scraps ?? [] };
      }
    }
  } catch (err) {
    console.warn('[listings] Supabase insert error:', err);
  }

  return newListing;
}

export async function removeListing(id) {
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

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('listings').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('[listings] Supabase delete error:', err);
  }
}

export async function updateListingStatus(id, status) {
  const timestamp = new Date().toISOString();

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

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('listings').update({ status, updated_at: timestamp }).eq('id', id);
    }
  } catch (err) {
    console.warn('[listings] Supabase update error:', err);
  }
}
