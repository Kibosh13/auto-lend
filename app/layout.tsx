import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { loadSiteContent } from './site-content-server';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadSiteContent();
  return {
    metadataBase: new URL(process.env.SITE_URL || 'https://ngreport.ru'),
    alternates: { canonical: 'https://ngreport.ru/' },
    title: { default: content.seoTitle, template: '%s — NG / Re:port' },
    icons: {
      icon: [{ url: content.faviconUrl }],
      shortcut: content.faviconUrl,
      apple: [{ url: content.faviconUrl }],
    },
    description: content.seoDescription,
    openGraph: {
      type: 'website', locale: 'ru_RU', title: content.seoOgTitle, description: content.seoOgDescription,
      images: [{ url: content.ogImageUrl, width: 1200, height: 630, alt: content.seoOgTitle }],
    },
    twitter: {
      card: 'summary_large_image', title: content.seoOgTitle, description: content.seoOgDescription, images: [content.ogImageUrl],
    },
  };
}

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
