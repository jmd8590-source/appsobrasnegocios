import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

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
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    title: 'ScrapLens',
    description: 'Gestión inteligente de materiales de recuperación industrial',
    siteName: 'ScrapLens',
  },
};

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
      <body className="bg-slate-950 text-slate-50 antialiased font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
