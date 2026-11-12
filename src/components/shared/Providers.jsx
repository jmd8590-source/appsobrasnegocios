'use client';

import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/shared/CookieConsent';

export function Providers({ initialLang, initialTheme, children }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <ThemeProvider initialTheme={initialTheme}>
        {children}
        <Toaster />
        <CookieConsent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
