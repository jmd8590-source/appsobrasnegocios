import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/utils';

// Server-only auth/demo state, used by route group layouts to guard access
// (replaces the Node.js proxy/middleware, which @opennextjs/cloudflare
// does not support on Cloudflare Workers)
export async function getAuthState() {
  const cookieStore = await cookies();
  const hasDemoCookie = cookieStore.get('scraplens_demo_session')?.value === 'true';

  // No backend configured at all on this deployment — every visitor is
  // necessarily on the demo/local experience, there's nothing to
  // authenticate against. Skip creating a Supabase client entirely: with
  // no (or a placeholder) NEXT_PUBLIC_SUPABASE_URL it throws synchronously
  // instead of failing gracefully, which would otherwise crash every route.
  if (!isSupabaseConfigured()) {
    return { user: null, isDemoSession: true };
  }

  // Supabase IS configured: always check for a real, authenticated user
  // first, regardless of the demo cookie. A real account must never be
  // treated as a demo session just because this browser also has a
  // leftover "Explorar versión demo" cookie from an earlier visit —
  // otherwise a genuine registered user would see the shared demo/local
  // data instead of their own clean account.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { user, isDemoSession: false };
  }

  return { user: null, isDemoSession: hasDemoCookie };
}
