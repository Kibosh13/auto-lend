import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://ngreport.ru'),
  alternates: { canonical: 'https://ngreport.ru/' },
  title: {
    default: 'NG / Re:port — аналитика для энерготрейдеров',
    template: '%s — NG / Re:port',
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png', sizes: '192x192' }],
    shortcut: '/favicon.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  description: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — в удобном редакционном формате.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    title: 'NG / Re:port — аналитика для энерготрейдеров',
    description: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — без информационного шума.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'NG / Re:port — аналитика для энерготрейдеров' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NG / Re:port — аналитика для энерготрейдеров',
    description: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — без информационного шума.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
