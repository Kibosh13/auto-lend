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
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3001'),
  title: {
    default: 'Market Note — аналитика для трейдеров',
    template: '%s — Market Note',
  },
  description: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — в удобном редакционном формате.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    title: 'Market Note — аналитика для трейдеров',
    description: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — без информационного шума.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Market Note — аналитика без шума' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market Note — аналитика для трейдеров',
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
