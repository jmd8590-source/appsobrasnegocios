'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/utils';
import { clearDemoSessionCookie, clearLocalPortalStorage } from '@/lib/storage/local-store';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Demo mode bypass
    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 800));
      router.push('/dashboard');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      clearDemoSessionCookie();
      clearLocalPortalStorage();
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? t('auth.invalidCredentials') : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    clearLocalPortalStorage();
    document.cookie = 'scraplens_demo_session=true; path=/; max-age=86400';
    await new Promise((r) => setTimeout(r, 400));
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main id="main-content" className="relative min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-xl mb-4">
            <Zap className="w-8 h-8 text-accent-ink" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-ink">{t('common.appName')}</h1>
          <p className="text-sm text-ink-muted mt-1">{t('auth.tagline')}</p>
        </div>

        {/* Form card */}
        <div className="bg-surface border border-edge rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink mb-1">{t('auth.loginTitle')}</h2>
          <p className="text-sm text-ink-muted mb-5">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-accent hover:text-accent-strong">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-danger-ink border border-danger/40 text-danger text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button type="submit" variant="amber" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
              {t('auth.enter')}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-edge">
            <Button
              variant="outline"
              className="w-full text-ink-muted hover:text-ink hover:bg-surface-2"
              onClick={handleDemoAccess}
              disabled={isLoading}
            >
              {t('auth.demoAccess')}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-ink-muted mt-5">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="text-accent hover:text-accent-strong font-medium">
            {t('auth.registerFree')}
          </Link>
        </p>
      </div>
    </main>
  );
}
