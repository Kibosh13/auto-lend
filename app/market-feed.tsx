'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MarketPost = {
  id: string;
  category: string;
  title: string;
  text: string;
  date: string;
  time: string;
  url: string;
  image?: string;
};

type FeedResponse = {
  posts: MarketPost[];
  source: 'telegram' | 'demo';
  channel?: string;
  fetchedAt: string;
};

const filters = ['Все', 'Рынок', 'Валюта', 'Сырьё', 'Идеи'];

const fallbackPosts: MarketPost[] = [
  {
    id: '248',
    category: 'Сырьё',
    title: 'Нефть удерживает диапазон, пока рынок оценивает новый баланс рисков',
    text: 'Brent остается выше ключевой зоны поддержки. Покупатели не ускоряются, но и продавцы пока не получают подтверждения для продолжения снижения. Базовый сценарий — консолидация перед новым импульсом.',
    date: '2 сентября',
    time: '08:40',
    url: '#',
  },
  {
    id: '247',
    category: 'Рынок',
    title: 'Индекс Мосбиржи: импульс есть, подтверждения объёмом пока нет',
    text: 'Спрос концентрируется в нескольких тяжеловесах. Для устойчивого движения выше рынку нужно расширение фронта роста; до этого работаем от уровней и не догоняем цену.',
    date: '1 сентября',
    time: '18:15',
    url: '#',
  },
  {
    id: '246',
    category: 'Валюта',
    title: 'Рубль вошёл в зону, где краткосрочный риск становится асимметричным',
    text: 'Волатильность снизилась, но календарь платежей и изменение экспортных потоков могут быстро вернуть движение. Смотрим не на прогноз точки, а на реакцию у обозначенных границ.',
    date: '1 сентября',
    time: '11:20',
    url: '#',
  },
  {
    id: '245',
    category: 'Идеи',
    title: 'Три сценария на неделю: где искать подтверждение, а где лучше подождать',
    text: 'Собрали рабочую карту недели по индексу, валюте и нефти. В каждом сценарии — триггер входа, условие отмены и ближайшая зона фиксации.',
    date: '31 августа',
    time: '19:05',
    url: '#',
  },
];

export function MarketFeed() {
  const [posts, setPosts] = useState<MarketPost[]>(fallbackPosts);
  const [activeFilter, setActiveFilter] = useState('Все');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [source, setSource] = useState<'telegram' | 'demo'>('demo');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadPosts = useCallback(async () => {
    setStatus((current) => (current === 'ready' ? 'ready' : 'loading'));
    try {
      const response = await fetch('/api/telegram', { cache: 'no-store' });
      if (!response.ok) throw new Error('Feed unavailable');
      const data = (await response.json()) as FeedResponse;
      if (data.posts.length) setPosts(data.posts);
      setSource(data.source);
      setUpdatedAt(new Date(data.fetchedAt));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadPosts();
    const timer = window.setInterval(loadPosts, 120_000);
    return () => window.clearInterval(timer);
  }, [loadPosts]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => activeFilter === 'Все' || post.category === activeFilter),
    [posts, activeFilter],
  );

  return (
    <section id="analytics" className="border-t border-border" aria-labelledby="feed-title">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <div>
            <p className="eyebrow">Аналитическая лента</p>
            <h2 id="feed-title" className="mt-5 max-w-md font-serif text-5xl leading-[0.94] tracking-[-0.045em] md:text-7xl">
              Последние наблюдения
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
              Публикации автоматически появляются здесь после выхода в Telegram. Лента проверяет обновления каждые две минуты.
            </p>

            <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground" aria-live="polite">
              <span className={`size-2 rounded-full ${source === 'telegram' ? 'bg-[#18835c]' : 'bg-[#c88d2e]'}`} />
              {source === 'telegram' ? 'Синхронизация активна' : 'Показан демонстрационный поток'}
              {updatedAt && <span>· {updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          </div>

          <div>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div className="flex flex-wrap gap-2" aria-label="Фильтр публикаций">
                {filters.map((filter) => (
                  <Button
                    key={filter}
                    type="button"
                    variant={activeFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={activeFilter === filter}
                    className="rounded-full px-4"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={loadPosts} className="text-muted-foreground">
                <RefreshCw className={`size-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>

            {status === 'error' && (
              <div className="mb-6 flex items-center gap-3 border border-border bg-card p-4 text-sm text-muted-foreground" role="status">
                <WifiOff className="size-4" />
                Telegram временно недоступен. Показываем сохранённые публикации.
              </div>
            )}

            <div>
              {visiblePosts.map((post, index) => (
                <article key={post.id} className="group grid gap-5 border-b border-border py-8 first:pt-0 md:grid-cols-[88px_1fr_auto] md:gap-7">
                  <div className="font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-muted-foreground">
                    {post.date}<br />{post.time} мск
                  </div>
                  <div className="max-w-3xl">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c53e2d]">{post.category}</span>
                      {index === 0 && <span className="rounded-full border border-[#c53e2d]/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#c53e2d]">Свежий</span>}
                    </div>
                    <h3 className="font-serif text-3xl leading-[1.06] tracking-[-0.025em] md:text-[2.55rem]">
                      {post.title}
                    </h3>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px] md:leading-7">{post.text}</p>
                    {post.url !== '#' && (
                      <a href={post.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] underline decoration-border underline-offset-4 hover:decoration-foreground">
                        Открыть в Telegram <ArrowUpRight className="size-3.5" />
                      </a>
                    )}
                  </div>
                  <span className="hidden size-11 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground md:grid" aria-hidden="true">
                    <ArrowUpRight className="size-4" />
                  </span>
                </article>
              ))}

              {!visiblePosts.length && (
                <div className="py-16 text-center text-sm text-muted-foreground">В этой рубрике пока нет публикаций.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
