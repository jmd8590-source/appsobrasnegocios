import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/utils';

// Server-only auth/demo state, used by route group layouts to guard access
// (replaces the Node.js proxy/middleware, which @opennextjs/cloudflare
// does not support on Cloudflare Workers)
export async function getAuthState() {
  const cookieStore = await cookies();
  const isDemoSession =
    cookieStore.get('scraplens_demo_session')?.value === 'true' || isDemoMode();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, isDemoSession };
}
