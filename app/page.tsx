import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { MarketFeed } from './market-feed';
import { SocialIcons } from './social-icons';

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-20 border-b border-border">
        <div className="mx-auto flex h-24 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <div className="brand-lockup">
            <a className="brand-logo-crop" href="#top" aria-label="Natural Gas RE:PORT — на главную">
              <Image src="/brand-logo-slash.jpg" alt="natural gas RE:PORT" width="1280" height="668" priority />
            </a>
            <SocialIcons />
          </div>

          <nav className="hidden items-center gap-7 text-xs md:flex" aria-label="Основная навигация">
            <a className="nav-link" href="#analytics">Обзоры</a>
            <a className="nav-link" href="#approach">Подход</a>
            <a className="nav-link" href="#contacts">Контакты</a>
          </nav>

          <a
            href="#analytics"
            className="hidden items-center gap-1.5 border-b border-foreground pb-1 text-xs font-medium sm:inline-flex"
          >
            Telegram <ArrowUpRight className="size-3" />
          </a>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-24">
          <div>
            <p className="eyebrow">Независимая аналитика для энерготрейдеров</p>
            <h1 className="mt-6 max-w-3xl font-serif text-[clamp(2.25rem,5.1vw,4.75rem)] leading-[1.02] tracking-[-0.04em]">
              Сигналы отрасли, которые конвертируются в торговый результат.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Короткие обзоры на американский и европейский природный газ, а также на нефть марки Brent. Факты, контекст и прогнозы — без лишнего новостного шума.
            </p>
          </div>

          <aside className="self-end border-t border-foreground pt-5">
            <p className="eyebrow">Свежий обзор · 2 сентября</p>
            <h2 className="mt-5 font-serif text-2xl leading-[1.12] tracking-[-0.02em] md:text-3xl">
              Нефть удерживает диапазон, пока рынок оценивает баланс рисков
            </h2>
            <a href="#analytics" className="group mt-7 flex items-center justify-between border-t border-border py-4 text-sm font-medium">
              Перейти к обзору
              <ArrowDownRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </a>
          </aside>
        </div>
      </section>

      <MarketFeed />

      <section id="approach" className="border-t border-border bg-card/45">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className="eyebrow">Редакционный подход</p>
            </div>
            <div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                Обзоры нашего информационно-аналитического издания помогают сделать один из сложнейших рыночных инструментов прозрачнее и яснее, а также подготовить план и собственную оценку риска.
              </p>
              <h2 className="mt-7 max-w-2xl font-serif text-4xl leading-[1.08] tracking-[-0.035em] md:text-5xl">
                От события — к понятной оценке и сценарию действия.
              </h2>
              <div className="mt-9 border-t border-foreground">
                {[
                  ['01', 'Отбираем факты', 'Оставляем только события, способные изменить цену или ожидания участников.'],
                  ['02', 'Проверяем реакцию', 'Сопоставляем новость с графиком, ликвидностью и поведением ключевых активов.'],
                  ['03', 'Фиксируем условия', 'Определяем триггер, условие отмены и диапазон, в котором идея сохраняет смысл.'],
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
          <p className="eyebrow">Контакты</p>
          <div>
            <p className="max-w-2xl font-serif text-2xl leading-[1.4] tracking-[-0.02em] md:text-3xl">Давид Абельман — специалист по нефтегазовому рынку, трейдер и редактор издания NG / Re:port.</p>
            <p className="mt-7 text-base">
              E-mail: <a className="inline-block border-b border-foreground pb-1" href="mailto:davidabelmane@gmail.com">davidabelmane@gmail.com</a>
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="eyebrow">Новые обзоры</p>
            <p className="mt-2 font-serif text-2xl tracking-[-0.02em]">Следите за обновлениями в Telegram</p>
          </div>
          <a href="#analytics" className="inline-flex w-fit items-center gap-2 border-b border-foreground pb-1 text-sm font-medium">
            Перейти к ленте <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="footer-inner mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="footer-brand brand-lockup">
            <a className="brand-logo-crop" href="#top" aria-label="Natural Gas RE:PORT — на главную">
              <Image src="/brand-logo-slash.jpg" alt="natural gas RE:PORT" width="1280" height="668" />
            </a>
            <SocialIcons />
          </div>
          <p className="footer-legal">
            Материалы носят информационный характер и не являются индивидуальной инвестиционной рекомендацией. ©&nbsp;2026
          </p>
        </div>
      </footer>
    </main>
  );
}
