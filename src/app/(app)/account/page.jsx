import { getAuthState } from '@/lib/auth/session';
import { AccountForm } from '@/components/account/AccountForm';

export default async function AccountPage() {
  const { user, isDemoSession } = await getAuthState();

  return <AccountForm userEmail={user?.email ?? null} isDemoSession={isDemoSession} />;
}
