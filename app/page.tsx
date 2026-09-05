import { ArrowUpRight } from 'lucide-react';
import { FeedProvider, LatestReview, MarketFeed } from './market-feed';
import { SocialIcons, SOCIAL_LINKS } from './social-icons';
import { loadSiteContent } from './site-content-server';

export default async function Home() {
  const content = await loadSiteContent();
  return (
    <FeedProvider><main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-20 border-b border-border">
        <div className="mx-auto flex h-24 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <div className="brand-lockup">
            <a className="brand-logo-crop" href="#top" aria-label="Natural Gas RE:PORT — на главную">
              {/* Dynamic logo URLs are validated by the settings service. */}
              {/* oxlint-disable-next-line next/no-img-element */}
              <img src={content.logoUrl} alt="natural gas RE:PORT" />
            </a>
            <SocialIcons />
          </div>

          <nav className="hidden items-center gap-7 text-xs md:flex" aria-label="Основная навигация">
            <a className="nav-link" href="#analytics">{content.navReviews}</a>
            <a className="nav-link" href="#approach">{content.navApproach}</a>
            <a className="nav-link" href="#contacts">{content.navContacts}</a>
          </nav>

          <a
            href={SOCIAL_LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram — открыть в новой вкладке"
            className="hidden items-center gap-1.5 border-b border-foreground pb-1 text-xs font-medium sm:inline-flex"
          >
            Telegram <ArrowUpRight className="size-3" />
          </a>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-24">
          <div>
            <p className="eyebrow">{content.heroEyebrow}</p>
            <h1 className="mt-6 max-w-3xl font-serif text-[clamp(2.25rem,5.1vw,4.75rem)] leading-[1.02] tracking-[-0.04em]">
              {content.heroTitle}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              {content.heroDescription}
            </p>
          </div>

          <LatestReview content={content} />
        </div>
      </section>

      <MarketFeed content={content} />

      <section id="approach" className="border-t border-border bg-card/45">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className="eyebrow">{content.approachEyebrow}</p>
            </div>
            <div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                {content.approachDescription}
              </p>
              <h2 className="mt-7 max-w-2xl font-serif text-4xl leading-[1.08] tracking-[-0.035em] md:text-5xl">
                {content.approachTitle}
              </h2>
              <div className="mt-9 border-t border-foreground">
                {[
                  ['01', content.approachStep1Title, content.approachStep1Text],
                  ['02', content.approachStep2Title, content.approachStep2Text],
                  ['03', content.approachStep3Title, content.approachStep3Text],
                ].map(([number, title, text]) => (
                  <article key={number} className="grid gap-3 border-b border-border py-5 sm:grid-cols-[48px_180px_minmax(0,1fr)] sm:gap-6">
                    <span className="font-mono text-[9px] text-muted-foreground">{number}</span>
                    <h3 className="text-sm font-medium">{title}</h3>
                    <p className="max-w-lg text-sm leading-6 text-muted-foreground">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contacts" className="border-t border-border">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
          <p className="eyebrow">{content.contactsEyebrow}</p>
          <div>
            <p className="max-w-2xl font-serif text-2xl leading-[1.4] tracking-[-0.02em] md:text-3xl">{content.contactsBio}</p>
            <p className="mt-7 text-base">
              {content.contactsEmailLabel} <a className="inline-block border-b border-foreground pb-1" href={`mailto:${content.contactsEmail}`}>{content.contactsEmail}</a>
            </p>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {content.contactsIntro} <a href={content.contactsLinkUrl} target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-border underline-offset-4">{content.contactsLinkLabel}</a> {content.contactsOutro}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="eyebrow">{content.ctaEyebrow}</p>
            <p className="mt-2 font-serif text-2xl tracking-[-0.02em]">{content.ctaTitle}</p>
          </div>
          <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram — открыть в новой вкладке" className="inline-flex w-fit items-center gap-2 border-b border-foreground pb-1 text-sm font-medium">
            {content.ctaButton} <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="footer-inner mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="footer-brand brand-lockup">
            <a className="brand-logo-crop" href="#top" aria-label="Natural Gas RE:PORT — на главную">
              {/* oxlint-disable-next-line next/no-img-element */}
              <img src={content.logoUrl} alt="natural gas RE:PORT" />
            </a>
            <SocialIcons />
          </div>
          <p className="footer-legal">
            {content.footerLegal}
          </p>
        </div>
      </footer>
    </main></FeedProvider>
  );
}
