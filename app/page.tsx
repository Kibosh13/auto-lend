import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { MarketFeed } from './market-feed';

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-20 border-b border-border">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 md:px-8">
          <a href="#top" aria-label="Market Note — на главную">
            <span className="text-[13px] font-semibold tracking-[0.2em]">MARKET NOTE</span>
          </a>

          <nav className="hidden items-center gap-7 text-xs md:flex" aria-label="Основная навигация">
            <a className="nav-link" href="#analytics">Обзоры</a>
            <a className="nav-link" href="#approach">Подход</a>
          </nav>

          <a
            href="#analytics"
            className="inline-flex items-center gap-1.5 border-b border-foreground pb-1 text-xs font-medium"
          >
            Telegram <ArrowUpRight className="size-3" />
          </a>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-24">
          <div>
            <p className="eyebrow">Независимая аналитика для трейдеров</p>
            <h1 className="mt-6 max-w-3xl font-serif text-[clamp(3.15rem,6vw,5.75rem)] leading-[0.93] tracking-[-0.045em]">
              Сигналы рынка — спокойно и по делу
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Короткие обзоры индекса, валюты и сырья. Факты, контекст и сценарии — без лишних обещаний и новостного шума.
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
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Обзор помогает подготовить план, но не заменяет собственную оценку риска.
              </p>
            </div>
            <div>
              <h2 className="max-w-2xl font-serif text-4xl leading-[1.02] tracking-[-0.035em] md:text-5xl">
                От события — к понятному сценарию
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

      <section id="about" className="border-t border-border">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
          <p className="eyebrow">О проекте</p>
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
            <p className="font-serif text-3xl leading-[1.12] tracking-[-0.025em] md:text-4xl">
              Независимый взгляд на рынок для тех, кто принимает решения сам.
            </p>
            <div className="text-sm leading-6 text-muted-foreground">
              <p>Аналитика строится на реакции цены, структуре рынка и управлении риском — без обещаний доходности.</p>
              <p className="mt-4">Короткие заметки выходят в Telegram и автоматически собираются здесь в единый архив.</p>
            </div>
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
        <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 py-7 text-xs text-muted-foreground md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-foreground">MARKET NOTE</p>
            <p className="mt-2">Аналитика без шума.</p>
          </div>
          <p className="max-w-xl leading-5 md:text-right">
            Материалы носят информационный характер и не являются индивидуальной инвестиционной рекомендацией. © 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
