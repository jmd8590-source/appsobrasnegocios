'use client';

import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const CONSENT_KEY = 'scraplens_cookie_consent';

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Deliberately a one-time, mount-only read of an external store
    // (localStorage) to decide whether to reveal the banner. Rendering
    // `null` first and flipping this after mount avoids an SSR/client
    // hydration mismatch, since `window.localStorage` doesn't exist on
    // the server. A single extra render for a bottom banner is cheap.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function persist(choice) {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
      document.cookie = `${CONSENT_KEY}=${choice}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // ignore — the banner just won't remember next time
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[90] safe-bottom border-t border-edge bg-surface/98 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Cookie className="w-4.5 h-4.5 text-accent" aria-hidden="true" />
          </span>
          <div>
            <p id="cookie-consent-title" className="text-sm font-semibold text-ink">
              {t('cookies.title')}
            </p>
            <p className="text-xs text-ink-muted mt-1 max-w-2xl">{t('cookies.description')}</p>
            <p className="text-[11px] text-ink-faint mt-1">{t('cookies.policyNote')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => persist('necessary')}>
            {t('cookies.necessaryOnly')}
          </Button>
          <Button variant="amber" size="sm" onClick={() => persist('accepted')}>
            {t('cookies.acceptAll')}
          </Button>
        </div>
      </div>
    </div>
  );
}
