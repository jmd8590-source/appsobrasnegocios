import { AppNav } from '@/components/shared/AppNav';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <AppNav />
      {/* Desktop: offset for sidebar */}
      <main className="lg:ml-64 pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
