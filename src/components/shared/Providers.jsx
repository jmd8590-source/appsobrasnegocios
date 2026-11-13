'use client';

import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { InstallPrompt } from '@/components/shared/InstallPrompt';

export function Providers({ initialLang, initialTheme, children }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <ThemeProvider initialTheme={initialTheme}>
        {/* Normal-flow top banner (not fixed): scrolls away under the
            sticky app header instead of fighting it for z-index/space. */}
        <InstallPrompt />
        {children}
        <Toaster />
        <CookieConsent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
