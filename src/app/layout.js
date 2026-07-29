import { Playfair_Display, Inter } from 'next/font/google';
import "./globals.css";
import PWAInstallPrompt from '../components/PWAInstallPrompt';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata = {
  title: "BookXBoi - Premium Editorial Digital Library",
  description: "A bespoke, hyper-premium, editorial-grade web reading experience.",
  appleWebApp: {
    capable: true,
    title: "BookXBoi",
    statusBarStyle: "black-translucent"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111413"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Fira+Code:wght@400;500&family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Noto+Serif+Bengali:wght@400;600;700&family=Nunito:wght@400;600;700&family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Spectral:ital,wght@0,400;0,600;1,400&family=Tiro+Bangla:ital@0;1&display=swap" 
          rel="stylesheet" 
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#111413" />
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
