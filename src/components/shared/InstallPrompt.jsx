'use client';

import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const DISMISSED_KEY = 'scraplens_install_dismissed_v1';

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own (non-standard) flag for "launched from home screen"
    window.navigator.standalone === true
  );
}

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  // iPadOS 13+ reports as "Macintosh" with touch support — catch that too.
  const isIpadOS13Plus = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIDevice || isIpadOS13Plus;
}

export function InstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // One-time, mount-only read of external state (localStorage + platform
    // APIs) — same rationale as CookieConsent/ProductTour: render nothing
    // first, decide after mount, avoid an SSR/client mismatch.
    try {
      if (isStandaloneDisplay()) return; // already installed — nothing to do
      const dismissed = window.localStorage.getItem(DISMISSED_KEY);
      if (dismissed) return;

      if (detectIOS()) {
        setIsIOS(true);
        setVisible(true);
        return;
      }
    } catch {
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    function onInstalled() {
      setVisible(false);
      try {
        window.localStorage.setItem(DISMISSED_KEY, 'true');
      } catch {
        // ignore
      }
    }
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t('install.bannerTitle')}
      className="w-full bg-surface border-b border-edge"
    >
      <div className="mx-auto max-w-5xl px-4 py-2.5 sm:px-6 flex items-center gap-3">
        <span className="shrink-0 w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
          <Download className="w-4 h-4 text-accent" aria-hidden="true" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ink truncate">{t('install.bannerTitle')}</p>
          {isIOS ? (
            <p className="text-[11px] text-ink-muted flex items-center gap-1 flex-wrap">
              {t('install.iosInstructions')}
              <Share className="w-3 h-3 inline" aria-hidden="true" />
              <SquarePlus className="w-3 h-3 inline" aria-hidden="true" />
            </p>
          ) : (
            <p className="text-[11px] text-ink-muted truncate">{t('install.bannerBody')}</p>
          )}
        </div>

        {!isIOS && (
          <Button variant="amber" size="sm" onClick={handleInstallClick} className="shrink-0">
            {t('install.installButton')}
          </Button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label={t('common.close')}
          className="shrink-0 p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
