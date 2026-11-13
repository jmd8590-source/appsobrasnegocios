import { createClient } from '@/lib/supabase/client';
import { DEMO_SCRAPS } from '@/lib/demo/data';

// =====================================================
// ScrapLens — Scraps Service
//
// Real, authenticated accounts are backed by Supabase ONLY — never by the
// shared browser localStorage bucket, and never by DEMO_SCRAPS as a
// fallback. A brand-new real user legitimately has zero rows; that must
// render as an empty inventory, not as someone else's (or the demo's)
// data. Only a session with no authenticated user (the "Explorar versión
// demo" flow, or no backend configured at all) uses localStorage.
// =====================================================

const STORAGE_KEY = 'scraplens_user_scraps_v1';

// createClient() throws SYNCHRONOUSLY (not a rejected promise) when
// Supabase isn't configured — with no backend, there's nothing to check
// a session against, so treat that exactly like "no user".
function getSupabaseClientSafe() {
  try {
    return createClient();
  } catch (err) {
    console.warn('[scraps] Supabase client unavailable (not configured):', err);
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
    console.warn('[scraps] Supabase auth check failed:', err);
    return { supabase, user: null };
  }
}

export async function getScraps() {
  const { supabase, user } = await getCurrentUser();

  if (user) {
    try {
      const { data, error } = await supabase
        .from('scraps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('[scraps] Supabase fetch failed for authenticated user:', err);
      // Fail closed: never show demo/local data to a real account just
      // because a request hiccuped.
      return [];
    }
  }

  // Demo / unauthenticated: localStorage-backed seed data only.
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_SCRAPS));
      return DEMO_SCRAPS;
    } catch {
      return DEMO_SCRAPS;
    }
  }

  return DEMO_SCRAPS;
}

/**
 * Save a new scrap item (from Manual Entry or Camera Scanner)
 */
export async function createScrap(item) {
  const { supabase, user } = await getCurrentUser();

  if (user) {
    const { data, error } = await supabase
      .from('scraps')
      .insert({
        user_id: user.id,
        material_name: item.material_name,
        category: item.category,
        subtype: item.subtype || null,
        image_url: item.image_url || null,
        weight_kg: Number(item.weight_kg) || 0,
        price_per_kg: Number(item.price_per_kg) || 0,
        total_value: Number(item.total_value) || 0,
        currency: 'EUR',
        ai_confidence: item.ai_confidence ?? null,
        condition_notes: item.condition_notes || null,
        status: item.status || 'available',
        is_demo: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[scraps] Supabase insert error:', error);
      throw error; // let the caller show a real error — don't pretend it saved
    }
    return data;
  }

  // Demo / unauthenticated: localStorage only.
  const timestamp = new Date().toISOString();
  const newScrap = {
    id: `scrap-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
    user_id: 'local-user',
    material_id: item.material_id || null,
    material_name: item.material_name,
    category: item.category,
    subtype: item.subtype || null,
    image_url: item.image_url || null,
    image_path: item.image_path || null,
    weight_kg: Number(item.weight_kg) || 0,
    price_per_kg: Number(item.price_per_kg) || 0,
    total_value: Number(item.total_value) || 0,
    currency: 'EUR',
    ai_confidence: item.ai_confidence ?? null,
    condition_notes: item.condition_notes || null,
    reference_object: item.reference_object || null,
    status: item.status || 'available',
    is_demo: true,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [...DEMO_SCRAPS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newScrap, ...existing]));
    } catch (e) {
      console.warn('[scraps] LocalStorage save error:', e);
    }
  }

  return newScrap;
}

/**
 * Delete a scrap item
 */
export async function removeScrap(id) {
  const { supabase, user } = await getCurrentUser();

  if (user) {
    const { error } = await supabase.from('scraps').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      console.error('[scraps] Supabase delete error:', error);
      throw error;
    }
    return;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing = JSON.parse(stored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((s) => s.id !== id)));
      }
    } catch (e) {
      console.warn('[scraps] LocalStorage delete error:', e);
    }
  }
}

/**
 * Update an existing scrap item
 */
export async function updateScrapItem(id, updates) {
  const { supabase, user } = await getCurrentUser();
  const timestamp = new Date().toISOString();

  if (user) {
    const { error } = await supabase
      .from('scraps')
      .update({ ...updates, updated_at: timestamp })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[scraps] Supabase update error:', error);
      throw error;
    }
    return;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing = JSON.parse(stored);
        const updated = existing.map((s) =>
          s.id === id ? { ...s, ...updates, updated_at: timestamp } : s
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[scraps] LocalStorage update error:', e);
    }
  }
}
