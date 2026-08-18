import { createClient } from '@/lib/supabase/client';
import { DEMO_SCRAPS } from '@/lib/demo/data';
import type { Scrap, ScrapFormValues } from '@/types';

const STORAGE_KEY = 'scraplens_user_scraps_v1';

/**
 * Get all scraps with unified Supabase + Local persistence
 */
export async function getScraps(): Promise<Scrap[]> {
  // 1. Try fetching from Supabase if user is logged in
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('scraps')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Scrap[];
      }
    }
  } catch (err) {
    console.warn('[scraps] Supabase fetch fallback to local:', err);
  }

  // 2. Client-side LocalStorage fallback / Demo mode
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Initialize with default demo scraps if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_SCRAPS));
      return DEMO_SCRAPS;
    } catch {
      return DEMO_SCRAPS;
    }
  }

  return DEMO_SCRAPS;
}

export type CreateScrapInput = Omit<
  Scrap,
  'id' | 'created_at' | 'updated_at' | 'user_id' | 'is_demo'
> & {
  user_id?: string;
  is_demo?: boolean;
};

/**
 * Save a new scrap item (from Manual Entry or Camera Scanner)
 */
export async function createScrap(item: CreateScrapInput): Promise<Scrap> {
  const timestamp = new Date().toISOString();
  const id = `scrap-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

  const newScrap: Scrap = {
    id,
    user_id: item.user_id || 'local-user',
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
    is_demo: item.is_demo ?? true,
    created_at: timestamp,
    updated_at: timestamp,
  };

  // 1. Save to LocalStorage immediately for instant UI availability
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing: Scrap[] = stored ? JSON.parse(stored) : [...DEMO_SCRAPS];
      const updated = [newScrap, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[scraps] LocalStorage save error:', e);
    }
  }

  // 2. If authenticated in Supabase, persist to database
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      newScrap.user_id = user.id;
      newScrap.is_demo = false;

      const { data, error } = await supabase
        .from('scraps')
        .insert({
          user_id: user.id,
          material_name: newScrap.material_name,
          category: newScrap.category,
          subtype: newScrap.subtype,
          image_url: newScrap.image_url,
          weight_kg: newScrap.weight_kg,
          price_per_kg: newScrap.price_per_kg,
          total_value: newScrap.total_value,
          currency: 'EUR',
          ai_confidence: newScrap.ai_confidence,
          condition_notes: newScrap.condition_notes,
          status: newScrap.status,
          is_demo: false,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Scrap;
      }
    }
  } catch (err) {
    console.warn('[scraps] Supabase insert error:', err);
  }

  return newScrap;
}

/**
 * Delete a scrap item
 */
export async function removeScrap(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing: Scrap[] = JSON.parse(stored);
        const updated = existing.filter((s) => s.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[scraps] LocalStorage delete error:', e);
    }
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('scraps').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('[scraps] Supabase delete error:', err);
  }
}

/**
 * Update an existing scrap item
 */
export async function updateScrapItem(id: string, updates: Partial<ScrapFormValues>): Promise<void> {
  const timestamp = new Date().toISOString();

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing: Scrap[] = JSON.parse(stored);
        const updated = existing.map((s) =>
          s.id === id ? { ...s, ...updates, updated_at: timestamp } : s
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[scraps] LocalStorage update error:', e);
    }
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('scraps').update({ ...updates, updated_at: timestamp }).eq('id', id);
    }
  } catch (err) {
    console.warn('[scraps] Supabase update error:', err);
  }
}
