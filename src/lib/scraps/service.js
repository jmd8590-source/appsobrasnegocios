import { getCurrentUser } from '@/lib/supabase/client-auth';
import {
  LOCAL_SCRAPS_KEY,
  readLocalCollection,
  writeLocalCollection,
  generateEntityId,
} from '@/lib/storage/local-store';

// =====================================================
// ScrapLens — Scraps Service
//
// Real, authenticated accounts are backed by Supabase ONLY — filtered strictly
// by `user_id` and excluding any `is_demo` records. Demo/unauthenticated
// sessions start clean (`[]`) and persist only user-created items in browser
// localStorage without pre-seeding any fictitious records.
// =====================================================

/**
 * Fetches scraps belonging exclusively to the current portal session.
 */
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
      return (data ?? []).filter((row) => row.is_demo !== true);
    } catch (err) {
      console.error('[scraps] Supabase fetch failed for authenticated user:', err);
      // Fail closed: never show demo/local data to a real account.
      return [];
    }
  }

  return readLocalCollection(LOCAL_SCRAPS_KEY);
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
      throw error;
    }
    return data;
  }

  const timestamp = new Date().toISOString();
  const newScrap = {
    id: generateEntityId('scrap'),
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
    is_demo: false,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const existing = readLocalCollection(LOCAL_SCRAPS_KEY);
  writeLocalCollection(LOCAL_SCRAPS_KEY, [newScrap, ...existing]);

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

  const existing = readLocalCollection(LOCAL_SCRAPS_KEY);
  writeLocalCollection(
    LOCAL_SCRAPS_KEY,
    existing.filter((s) => s.id !== id)
  );
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

  const existing = readLocalCollection(LOCAL_SCRAPS_KEY);
  const updated = existing.map((s) =>
    s.id === id ? { ...s, ...updates, updated_at: timestamp } : s
  );
  writeLocalCollection(LOCAL_SCRAPS_KEY, updated);
}
