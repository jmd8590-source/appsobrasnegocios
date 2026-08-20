'use client';

import Link from 'next/link';
import { LayoutDashboard, Package, Camera, PenSquare, Layers, LogOut, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/inventory', icon: Package, label: 'Inventario' },
  { href: '/scanner', icon: Camera, label: 'Escanear', primary: true },
  { href: '/manual-entry', icon: PenSquare, label: 'Entrar a mano' },
  { href: '/lots', icon: Layers, label: 'Lotes' },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    document.cookie = 'scraplens_demo_session=; path=/; max-age=0';
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-800 fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Zap className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100">ScrapLens</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  item.primary
                    ? isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : isActive
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                <item.icon className={cn('w-5 h-5', item.primary && !isActive && 'text-amber-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 -mt-6"
                >
                  <div className={cn(
                    'relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-200 active:scale-95',
                    isActive
                      ? 'bg-amber-500 shadow-amber-500/40'
                      : 'bg-amber-500 shadow-amber-500/30 hover:bg-amber-400'
                  )}>
                    <item.icon className="w-6 h-6 text-slate-950" />
                  </div>
                  <span className="text-[10px] font-medium text-amber-400">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1"
              >
                <item.icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-amber-400' : 'text-slate-500'
                )} />
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-amber-400' : 'text-slate-500'
                )}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
