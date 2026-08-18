import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client
// Only uses public ANON key — safe for client-side use
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
