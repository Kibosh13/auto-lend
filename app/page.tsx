import { ArrowDown, ArrowUpRight, Radio } from 'lucide-react';
import { MarketFeed } from './market-feed';

const marketSnapshot = [
  { ticker: 'IMOEX', value: '2 914,27', change: '+0,84%', positive: true },
  { ticker: 'USD / RUB', value: '81,46', change: '−0,31%', positive: false },
  { ticker: 'BRENT', value: '$76,18', change: '+1,12%', positive: true },
  { ticker: 'GOLD', value: '$3 471', change: '+0,26%', positive: true },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-20 border-b border-border/80">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10 lg:px-14">
          <a href="#top" className="flex items-center gap-3" aria-label="Market Note — на главную">
            <span className="grid size-9 place-items-center rounded-full border border-foreground font-mono text-[10px] font-bold tracking-[-0.08em]">
              MN
            </span>
            <span className="text-sm font-semibold tracking-[0.18em]">MARKET NOTE</span>
          </a>

          <nav className="hidden items-center gap-8 text-xs font-medium md:flex" aria-label="Основная навигация">
            <a className="nav-link" href="#analytics">Обзоры</a>
            <a className="nav-link" href="#approach">Подход</a>
            <a className="nav-link" href="#about">Об авторе</a>
          </nav>

          <a
            href="#analytics"
            className="inline-flex items-center gap-2 rounded-full border border-foreground px-4 py-2 text-xs font-medium transition-colors hover:bg-foreground hover:text-background"
          >
            <span className="hidden sm:inline">Лента из</span> Telegram
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-[1440px] px-5 pb-14 pt-8 md:px-10 md:pb-20 md:pt-12 lg:px-14">
        <div className="mb-10 flex items-center justify-between border-b border-border pb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:mb-14">
          <span>Ежедневный аналитический обзор</span>
          <span>02 / 09 / 2026</span>
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:gap-20">
          <div>
            <div className="mb-7 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c53e2d]">
              <Radio className="size-3.5" />
              Главный тезис дня
            </div>
            <h1 className="max-w-5xl font-serif text-[clamp(3.7rem,8.2vw,8.2rem)] leading-[0.84] tracking-[-0.065em]">
              Рынок платит за терпение.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-muted-foreground md:ml-[22%] md:mt-10 md:text-lg md:leading-8">
              Разбираем движение индекса, валюты и сырья без информационного шума — только сигналы, контекст и сценарии на следующую сессию.
            </p>
          </div>

          <aside className="self-end border-t border-foreground pt-5">
            <div className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-[#d94a34]" />
              Рынок открыт · обновлено 2 мин назад
            </div>
            <blockquote className="font-serif text-2xl leading-tight tracking-[-0.02em]">
              «Не предсказываем точку. Готовимся к реакции рынка».
            </blockquote>
            <a href="#analytics" className="group mt-8 flex items-center justify-between border-t border-border py-4 text-sm font-medium">
              Читать свежий обзор
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-1" />
            </a>
          </aside>
        </div>
      </section>

      <section className="border-y border-border bg-card" aria-label="Срез рынка">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-5 md:grid-cols-4 md:px-10 lg:px-14">
          {marketSnapshot.map((item, index) => (
            <div
              key={item.ticker}
              className={`py-6 md:px-7 md:py-7 ${index % 2 === 0 ? 'border-r border-border pr-5' : 'pl-5'} ${index > 1 ? 'border-t border-border md:border-t-0' : ''} ${index > 0 ? 'md:border-l md:border-border' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{item.ticker}</p>
                <span className={`font-mono text-[10px] ${item.positive ? 'text-[#18835c]' : 'text-[#c53e2d]'}`}>{item.change}</span>
              </div>
              <p className="mt-2 text-xl font-medium tracking-[-0.025em] md:text-2xl">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketFeed />

      <section id="approach" className="border-t border-border bg-[#171715] text-[#f3f0e8]">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28 lg:px-14">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="eyebrow text-[#aaa69d]">Принцип работы</p>
              <p className="mt-6 max-w-xs text-sm leading-6 text-[#aaa69d]">
                Обзор помогает сформировать план, но не заменяет собственную оценку риска.
              </p>
            </div>
            <div>
              <h2 className="max-w-4xl font-serif text-5xl leading-[0.96] tracking-[-0.045em] md:text-7xl">
                Факты → контекст → торговый сценарий
              </h2>
              <div className="mt-12 grid gap-px bg-[#3a3833] md:grid-cols-3">
                {[
                  ['01', 'Отсекаем шум', 'Выбираем только события, которые способны изменить цену или ожидания участников.'],
                  ['02', 'Проверяем тезис', 'Сопоставляем новость с графиком, ликвидностью и поведением ключевых активов.'],
                  ['03', 'Готовим сценарии', 'Фиксируем триггер, уровень отмены и диапазон, в котором идея сохраняет смысл.'],
                ].map(([number, title, text]) => (
                  <article key={number} className="bg-[#171715] p-6 md:min-h-64 md:p-8">
                    <span className="font-mono text-[10px] text-[#aaa69d]">{number}</span>
                    <h3 className="mt-12 text-xl font-medium tracking-tight">{title}</h3>
                    <p className="mt-4 text-sm leading-6 text-[#aaa69d]">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="border-b border-border">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-14">
          <p className="eyebrow">Об авторе</p>
          <div>
            <p className="max-w-4xl font-serif text-4xl leading-[1.05] tracking-[-0.035em] md:text-6xl">
              Независимый взгляд на рынок для тех, кто принимает решения сам.
            </p>
            <div className="mt-10 grid gap-6 border-t border-border pt-6 text-sm leading-7 text-muted-foreground md:grid-cols-2">
              <p>Аналитика строится на реакции цены, структуре рынка и понятном управлении риском — без обещаний доходности и перегруженных терминов.</p>
              <p>Все короткие заметки сначала выходят в Telegram, а затем автоматически собираются здесь в удобный архив для чтения и поиска.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 text-center md:px-10 md:py-28 lg:px-14">
        <p className="eyebrow">Оставайтесь в контексте</p>
        <h2 className="mx-auto mt-6 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.045em] md:text-7xl">
          Один обзор. Один тезис. Никакого шума.
        </h2>
        <a href="#analytics" className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5">
          Перейти к аналитике <ArrowUpRight className="size-4" />
        </a>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-end md:justify-between md:px-10 lg:px-14">
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
