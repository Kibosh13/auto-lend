'use client';

/* oxlint-disable next/no-img-element, jsx-a11y/media-has-caption -- Channel media has intrinsic sizes; Telegram does not supply caption tracks. */

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Media = { key: string; kind: string; name: string; mime: string; status: string; url: string | null };
type Post = { id: string; title: string; text: string; publishedAt: string; url: string; media: Media[] };
type Feed = { posts: Post[]; nextOffset: number | null };
type State = Feed & { status: 'loading' | 'ready' | 'error'; refreshing: boolean; load: (more?: boolean) => Promise<void> };
const FeedContext = createContext<State | null>(null);
const useFeed = () => useContext(FeedContext)!;

export function FeedProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<Feed>({ posts: [], nextOffset: null });
  const [status, setStatus] = useState<State['status']>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (more = false) => {
    setRefreshing(true);
    try {
      const offset = more ? feed.nextOffset : 0;
      const response = await fetch(`/api/telegram?offset=${offset || 0}`, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Feed unavailable');
      const data = await response.json() as Feed;
      if (!Array.isArray(data.posts)) throw new Error('Invalid feed');
      setFeed(previous => ({
        posts: more ? [...new Map([...previous.posts, ...data.posts].map(post => [post.id, post])).values()] : data.posts,
        nextOffset: data.nextOffset,
      }));
      setStatus('ready');
    } catch { setStatus('error'); }
    finally { setRefreshing(false); }
  }, [feed.nextOffset]);
  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch('/api/telegram', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw new Error('Feed unavailable');
        const data = await response.json() as Feed;
        if (!Array.isArray(data.posts)) throw new Error('Invalid feed');
        setFeed(previous => previous.posts.length <= 20 ? data : {
          posts: [...data.posts, ...previous.posts.filter(post => !data.posts.some(fresh => fresh.id === post.id))],
          nextOffset: previous.nextOffset,
        });
        setStatus('ready');
      } catch { setStatus('error'); }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => window.clearInterval(timer);
  }, []);
  return <FeedContext.Provider value={{ ...feed, status, refreshing, load }}>{children}</FeedContext.Provider>;
}

export function LatestReview() {
  const { posts } = useFeed();
  const latest = posts[0];
  return <aside className="self-end border-t border-foreground pt-5">
    <p className="eyebrow">{latest ? 'Свежий обзор' : 'В фокусе издания'}</p>
    <h2 className="mt-5 font-serif text-2xl leading-[1.12] tracking-[-0.02em] md:text-3xl">
      {latest?.title || 'Природный газ и Brent: факты, контекст и прогнозы'}
    </h2>
    <a href={latest ? `#${latest.id}` : '#analytics'} className="group mt-7 flex items-center justify-between border-t border-border py-4 text-sm font-medium">
      {latest ? 'Перейти к обзору' : 'К публикациям'}
      <ArrowDownRight className="size-4" />
    </a>
  </aside>;
}

function PostMedia({ media, postUrl }: { media: Media[]; postUrl: string }) {
  if (!media.length) return null;
  return <div className="mt-5 grid min-w-0 gap-4">
    {media.map((file, index) => <div key={file.key} className="min-w-0">
      {!file.url ? <a href={postUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4">
        {file.status === 'pending' ? 'Медиа загружается — открыть в Telegram' : 'Открыть вложение в Telegram'}
      </a> : file.mime.startsWith('image/') ? <a href={file.url} target="_blank" rel="noopener noreferrer">
        {/* Telegram images have variable dimensions and are served from our media store. */}
        <img src={file.url} alt={file.name || `Иллюстрация к публикации, ${index + 1}`} loading="lazy" className="h-auto max-h-[600px] w-full object-contain object-left" />
      </a> : file.mime.startsWith('video/') ? <video controls playsInline preload="metadata" className="max-h-[600px] w-full" src={file.url} aria-label={file.name || 'Видео к публикации'} />
        : file.mime.startsWith('audio/') ? <audio controls preload="none" className="w-full" src={file.url} aria-label={file.name || 'Аудио к публикации'} />
          : <a href={file.url} className="break-all text-sm underline underline-offset-4">Скачать {file.name || 'файл'}</a>}
    </div>)}
  </div>;
}

export function MarketFeed() {
  const { posts, nextOffset, status, refreshing, load } = useFeed();
  return <section id="analytics" className="border-t border-border" aria-labelledby="feed-title">
    <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
        <div>
          <p className="eyebrow">Архив публикаций</p>
          <h2 id="feed-title" className="mt-5 font-serif text-4xl leading-none tracking-[-0.035em] md:text-5xl">Последние обзоры</h2>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">Новые записи из канала NG / Re:port: текст, графики и медиа в одном месте.</p>
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="text-xs text-muted-foreground">Публикации из Telegram</p>
            <Button variant="ghost" size="sm" onClick={() => void load()} disabled={refreshing} className="rounded-none text-xs">
              <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} /> Обновить
            </Button>
          </div>
          {status === 'error' && <output className="block py-5 text-sm text-muted-foreground">
            Не удалось обновить ленту. {posts.length ? 'Ранее загруженные обзоры остаются доступными.' : 'Попробуйте позже или откройте наш Telegram.'}
          </output>}
          {!posts.length && status !== 'error' && <output className="block py-10 text-sm leading-6 text-muted-foreground">
            {status === 'loading' ? 'Загружаем обзоры…' : 'Публикаций пока нет. Новые обзоры появятся здесь после выхода в канале.'}
          </output>}
          {posts.map(post => <article id={post.id} key={post.id} className="scroll-mt-8 border-b border-border py-8">
            <time dateTime={post.publishedAt} className="font-mono text-[10px] text-muted-foreground">
              {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }).format(new Date(post.publishedAt))} мск
            </time>
            <h3 className="mt-4 break-words font-serif text-[1.75rem] leading-[1.12] tracking-[-0.02em] md:text-[2rem]">{post.title}</h3>
            {post.text && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{post.text}</p>}
            <PostMedia media={post.media} postUrl={post.url} />
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-xs underline decoration-border underline-offset-4">
              Открыть в Telegram <ArrowUpRight className="size-3" />
            </a>
          </article>)}
          {nextOffset !== null && <Button variant="outline" className="mt-6" disabled={refreshing} onClick={() => void load(true)}>Показать ещё</Button>}
        </div>
      </div>
    </div>
  </section>;
}
