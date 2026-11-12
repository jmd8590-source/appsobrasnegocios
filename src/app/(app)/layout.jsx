import { redirect } from 'next/navigation';
import { AppNav } from '@/components/shared/AppNav';
import { getAuthState } from '@/lib/auth/session';

export default async function AppLayout({ children }) {
  const { user, isDemoSession } = await getAuthState();

  if (!isDemoSession && !user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      {/* Desktop: offset for sidebar */}
      <main id="main-content" className="lg:ml-64 pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
