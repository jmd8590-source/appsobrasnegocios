'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-xl mb-4">
            <Zap className="w-8 h-8 text-accent-ink" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-ink">{t('common.appName')}</h1>
          <p className="text-sm text-ink-muted mt-1">{t('auth.tagline')}</p>
        </div>

        <div className="bg-surface border border-edge rounded-2xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <div className="w-12 h-12 rounded-full bg-positive-ink text-positive border border-positive/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-ink">{t('auth.resetSentTitle')}</h2>
              <p className="text-sm text-ink-muted">{t('auth.resetSentDesc')}</p>
              {isDemoMode() && (
                <p className="text-xs text-ink-faint pt-1">{t('auth.resetDemoNotice')}</p>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-ink mb-1">{t('auth.forgotTitle')}</h2>
              <p className="text-sm text-ink-muted mb-5">{t('auth.forgotSubtitle')}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && (
                  <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-danger-ink border border-danger/40 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {error}
                  </div>
                )}

                <Button type="submit" variant="amber" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
                  {t('auth.sendResetLink')}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-5">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink font-medium">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </main>
  );
}
