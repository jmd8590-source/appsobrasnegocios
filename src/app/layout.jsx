import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from '@/components/shared/Providers';
import { THEME_BLOCKING_SCRIPT } from '@/lib/theme/ThemeProvider';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/lib/i18n/dictionaries';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'ScrapLens — Gestión inteligente de materiales de recuperación',
    template: '%s | ScrapLens',
  },
  description:
    'Identifica, valora y gestiona materiales industriales de recuperación con inteligencia artificial. Cobre, aluminio, acero, madera, plástico y más.',
  keywords: ['chatarra', 'reciclaje', 'recuperación', 'materiales', 'IA', 'industrial', 'scrap'],
  authors: [{ name: 'ScrapLens' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ScrapLens',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    title: 'ScrapLens',
    description: 'Gestión inteligente de materiales de recuperación industrial',
    siteName: 'ScrapLens',
  },
};

export const viewport = {
  themeColor: '#08090b',
  width: 'device-width',
  initialScale: 1,
  // No maximumScale / userScalable: false here — locking pinch-zoom blocks
  // low-vision users from resizing content (WCAG 1.4.4) and is exactly the
  // kind of accessibility regression this app must not ship with.
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('scraplens_lang')?.value;
  const themeCookie = cookieStore.get('scraplens_theme')?.value;
  const initialLang = SUPPORTED_LANGUAGES.includes(langCookie) ? langCookie : DEFAULT_LANGUAGE;
  const initialTheme = themeCookie === 'light' ? 'light' : 'dark';

  return (
    <html
      lang={initialLang}
      data-theme={initialTheme}
      className={inter.variable}
      // The render-blocking script below can flip data-theme (and the
      // language toggle can flip lang) on the client before hydration,
      // purely to avoid a flash of the wrong theme — React must not warn
      // about (or try to "fix") that expected, intentional mismatch.
      suppressHydrationWarning
    >
      <head>
        {/* Icon <link> tags are generated automatically by the `icons` field
            in `metadata` above — do not hand-add them here too, or browsers
            get duplicate/conflicting entries. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Render-blocking: applies the stored/system theme before paint so
            toggling never causes a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BLOCKING_SCRIPT }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-canvas text-ink antialiased font-sans">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal / Skip to main content
        </a>
        <Providers initialLang={initialLang} initialTheme={initialTheme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
