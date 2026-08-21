import { redirect } from 'next/navigation';
import { getAuthState } from '@/lib/auth/session';

export default async function Home() {
  const { user } = await getAuthState();
  redirect(user ? '/dashboard' : '/login');
}
