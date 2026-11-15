'use client';

import Link from 'next/link';
import { LayoutDashboard, Package, Camera, PenSquare, Layers, LogOut, Zap, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { isDemoMode } from '@/lib/utils';
import { clearDemoSessionCookie, clearLocalPortalStorage } from '@/lib/storage/local-store';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useProductTour, TourTriggerButton, ProductTourDialog } from '@/components/shared/ProductTour';

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const tour = useProductTour();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/inventory', icon: Package, label: t('nav.inventory') },
    { href: '/scanner', icon: Camera, label: t('nav.scanner'), primary: true },
    { href: '/manual-entry', icon: PenSquare, label: t('nav.manualEntry') },
    { href: '/lots', icon: Layers, label: t('nav.lots') },
  ];

  async function handleLogout() {
    clearDemoSessionCookie();
    clearLocalPortalStorage();
    if (!isDemoMode()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-surface border-r border-edge fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-edge">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-accent-ink" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-lg text-ink">{t('common.appName')}</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label={t('nav.dashboard')}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  item.primary
                    ? isActive
                      ? 'bg-accent text-accent-ink'
                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                    : isActive
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                )}
              >
                <item.icon className={cn('w-5 h-5', item.primary && !isActive && 'text-accent')} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Account & logout */}
        <div className="px-3 pb-4 border-t border-edge pt-4 space-y-1">
          <Link
            href="/account"
            aria-current={pathname.startsWith('/account') ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname.startsWith('/account')
                ? 'bg-surface-2 text-ink'
                : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
            )}
          >
            <UserCircle className="w-5 h-5" aria-hidden="true" />
            {t('nav.account')}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-all duration-200 w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Desktop top bar — language / theme / tour controls, always top-right */}
      <header className="hidden lg:flex lg:ml-64 sticky top-0 z-30 h-14 items-center justify-end gap-2 px-6 bg-canvas/95 backdrop-blur-md border-b border-edge">
        <TourTriggerButton onClick={tour.start} />
        <LanguageSwitcher />
        <ThemeToggle />
      </header>

      {/* Mobile top header with logo and controls */}
      <header className="lg:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-edge px-4 py-3 flex items-center justify-between gap-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-accent-ink" aria-hidden="true" />
          </div>
          <span className="font-bold text-base text-ink">{t('common.appName')}</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <TourTriggerButton onClick={tour.start} />
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/account"
            aria-label={t('nav.account')}
            aria-current={pathname.startsWith('/account') ? 'page' : undefined}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-surface-2 text-ink-muted hover:text-ink hover:border-edge-strong transition-colors"
          >
            <UserCircle className="w-4 h-4" aria-hidden="true" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-danger hover:bg-danger/10 border border-edge transition-all cursor-pointer"
            aria-label={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-edge safe-bottom" aria-label={t('nav.dashboard')}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="flex flex-col items-center gap-0.5 -mt-6"
                >
                  <div className={cn(
                    'relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-200 active:scale-95',
                    'bg-accent',
                    isActive ? 'shadow-accent/40' : 'shadow-accent/30 hover:bg-accent-strong'
                  )}>
                    <item.icon className="w-6 h-6 text-accent-ink" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-medium text-accent">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 px-3 py-1"
              >
                <item.icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-accent' : 'text-ink-faint'
                )} aria-hidden="true" />
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-ink-faint'
                )}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ProductTourDialog open={tour.open} step={tour.step} setStep={tour.setStep} close={tour.close} />
    </>
  );
}
