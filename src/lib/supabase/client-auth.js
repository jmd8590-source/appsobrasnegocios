import { createClient } from '@/lib/supabase/client';

/**
 * Safely instantiates the browser Supabase client, returning null when
 * Supabase environment credentials are missing or use placeholder values.
 */
export function getSupabaseClientSafe() {
  try {
    return createClient();
  } catch (err) {
    console.warn('[auth-client] Supabase client unavailable (not configured):', err);
    return null;
  }
}

/**
 * Returns the browser Supabase client alongside the currently authenticated user
 * (or `{ supabase: null, user: null }` / `{ supabase, user: null }` when unauthenticated).
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClientSafe();
  if (!supabase) return { supabase: null, user: null };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
  } catch (err) {
    console.warn('[auth-client] Supabase auth check failed:', err);
    return { supabase, user: null };
  }
}

