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
};

type FeedResponse = {
  posts: MarketPost[];
  source: 'telegram' | 'demo';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadPosts = useCallback(async () => {
    setIsRefreshing(true);
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
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadPosts();
    }, 0);
    const timer = window.setInterval(loadPosts, 120_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadPosts]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => activeFilter === 'Все' || post.category === activeFilter),
    [posts, activeFilter],
  );

  return (
    <section id="analytics" className="border-t border-border" aria-labelledby="feed-title">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
          <div>
            <p className="eyebrow">Архив публикаций</p>
            <h2 id="feed-title" className="mt-5 font-serif text-4xl leading-none tracking-[-0.035em] md:text-5xl">
              Последние обзоры
            </h2>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Новые записи автоматически появляются после публикации в Telegram.
            </p>
            <p className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted-foreground" aria-live="polite">
              {source === 'telegram' ? 'Синхронизация с каналом активна' : 'Демонстрационная лента · канал ещё не подключён'}
              {updatedAt && <><br />Проверено в {updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</>}
            </p>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Фильтр публикаций">
                {filters.map((filter) => (
                  <Button
                    key={filter}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={activeFilter === filter}
                    className={`h-auto rounded-none px-0 py-1 text-xs hover:bg-transparent ${activeFilter === filter ? 'text-foreground underline decoration-1 underline-offset-4' : 'text-muted-foreground'}`}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { void loadPosts(); }}
                disabled={isRefreshing}
                className="h-auto rounded-none px-0 py-1 text-xs text-muted-foreground hover:bg-transparent"
              >
                <RefreshCw className={`size-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>

            {status === 'error' && (
              <output className="my-5 flex items-center gap-3 border border-border bg-card p-4 text-sm text-muted-foreground">
                <WifiOff className="size-4" />
                Telegram временно недоступен. Показываем сохранённые публикации.
              </output>
            )}

            <div>
              {visiblePosts.map((post, index) => (
                <article key={post.id} className="group grid gap-4 border-b border-border py-7 md:grid-cols-[96px_minmax(0,1fr)_24px] md:gap-6">
                  <div className="font-mono text-[9px] uppercase leading-5 tracking-[0.11em] text-muted-foreground">
                    {post.date}<br />{post.time} мск
                  </div>
                  <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      <span>{post.category}</span>
                      {index === 0 && <span className="text-[#8f342a]">Новый</span>}
                    </div>
                    <h3 className="font-serif text-[1.75rem] leading-[1.08] tracking-[-0.02em] md:text-[2rem]">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.text}</p>
                    {post.url !== '#' && (
                      <a href={post.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs underline decoration-border underline-offset-4 hover:decoration-foreground">
                        Открыть в Telegram <ArrowUpRight className="size-3" />
                      </a>
                    )}
                  </div>
                  <ArrowUpRight className="mt-1 hidden size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:block" aria-hidden="true" />
                </article>
              ))}

              {!visiblePosts.length && (
                <div className="py-14 text-center text-sm text-muted-foreground">В этой рубрике пока нет публикаций.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
