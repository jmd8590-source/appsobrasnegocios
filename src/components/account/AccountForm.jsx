'use client';

import { useState } from 'react';
import { UserCircle, Lock, Eye, EyeOff, AlertCircle, Loader2, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const MIN_PASSWORD_LENGTH = 8;

export function AccountForm({ userEmail, isDemoSession }) {
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t('account.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('account.passwordMismatch'));
      return;
    }
    if (newPassword === currentPassword) {
      setError(t('account.passwordSameAsOld'));
      return;
    }

    setIsSaving(true);
    try {
      if (isDemoSession) {
        // No real backend in demo mode — simulate the round trip honestly
        // rather than silently pretending nothing happened.
        await new Promise((resolve) => setTimeout(resolve, 700));
        toast({ title: t('account.demoSuccessTitle'), description: t('account.demoSuccessDesc') });
        resetForm();
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError(t('account.noSession'));
        return;
      }

      // Supabase's updateUser() trusts the current session and has no
      // separate "verify this password" endpoint, so the standard way to
      // actually confirm the current password is to attempt a real sign-in
      // with it. A wrong password fails here before anything is changed.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        setError(t('account.wrongCurrentPassword'));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message || t('account.genericError'));
        return;
      }

      toast({ title: t('account.successTitle'), description: t('account.successDesc') });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.genericError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
          <UserCircle className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('account.title')}</h1>
          <p className="text-sm text-ink-muted">{t('account.subtitle')}</p>
        </div>
      </div>

      {/* Account info */}
      <Card className="mb-6">
        <CardContent className="p-5">
          {isDemoSession ? (
            <div className="flex items-start gap-2 text-sm text-ink-muted">
              <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
              <p>{t('account.demoAccountNotice')}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-surface-2 border border-edge flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-ink-muted" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-faint">{t('account.signedInAs')}</p>
                <p className="text-sm font-medium text-ink truncate">{userEmail}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-accent" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">{t('account.changePasswordTitle')}</h2>
          </div>
          <p className="text-xs text-ink-muted mb-5">{t('account.changePasswordSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="current_password">{t('account.currentPassword')}</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden="true" />
                <Input
                  id="current_password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
                  aria-label={showCurrent ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showCurrent}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_password">{t('account.newPassword')}</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden="true" />
                  <Input
                    id="new_password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.minChars')}
                    className="pl-9 pr-10"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    aria-label={showNew ? t('auth.hidePassword') : t('auth.showPassword')}
                    aria-pressed={showNew}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm_password">{t('account.confirmPassword')}</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden="true" />
                  <Input
                    id="confirm_password"
                    type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.minChars')}
                    className="pl-9"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-danger-ink border border-danger/40 text-danger text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button type="submit" variant="amber" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : <KeyRound className="w-4 h-4 mr-2" aria-hidden="true" />}
              {t('account.saveButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
