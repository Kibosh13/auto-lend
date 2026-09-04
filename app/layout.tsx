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
    default: 'Natural Gas RE:PORT — аналитика для энерготрейдеров',
    template: '%s — Natural Gas RE:PORT',
  },
  description: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — в удобном редакционном формате.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    title: 'Natural Gas RE:PORT — аналитика для энерготрейдеров',
    description: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — без информационного шума.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Natural Gas RE:PORT — аналитика для энерготрейдеров' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Natural Gas RE:PORT — аналитика для энерготрейдеров',
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
