import type { Metadata, Viewport } from 'next';
import { Manrope, Marcellus, Noto_Kufi_Arabic } from 'next/font/google';
import './globals.css';
import { InstallPrompt } from './components/InstallPrompt';
import { ThemeToggle } from './components/ThemeToggle';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

const displayFont = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap'
});

const arabicFont = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  variable: '--font-arabic',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Safi Cavaliers | Gestion Restaurant',
  description: 'Gestion de commandes, cuisine, stock et service pour Safi Cavaliers',
  applicationName: 'Safi Cavaliers',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Safi Cavaliers'
  },
  other: {
    'mobile-web-app-capable': 'yes'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#8b5a36'
};

const themeInitScript = `
(() => {
  const storageKey = 'safi_cavaliers_theme';
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(storageKey);
  const resolvedTheme =
    savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#17110e' : '#f6eee2');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${arabicFont.variable}`}>
        {children}
        <ThemeToggle />
        <InstallPrompt />
      </body>
    </html>
  );
}
