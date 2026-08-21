import { redirect } from 'next/navigation';
import { getAuthState } from '@/lib/auth/session';

export default async function AuthLayout({ children }) {
  const { user, isDemoSession } = await getAuthState();

  if (!isDemoSession && user) {
    redirect('/dashboard');
  }

  return children;
}
