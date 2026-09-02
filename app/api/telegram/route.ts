type TelegramPost = {
  id: string;
  category: string;
  title: string;
  text: string;
  date: string;
  time: string;
  url: string;
};

const demoPosts: TelegramPost[] = [
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

function decodeEntities(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function classify(text: string) {
  const lower = text.toLowerCase();
  if (/нефт|газ|золот|brent|сырь/.test(lower)) return 'Сырьё';
  if (/рубл|доллар|юан|валют|usd|cny/.test(lower)) return 'Валюта';
  if (/иде|сценари|сделк|уровн/.test(lower)) return 'Идеи';
  return 'Рынок';
}

function parseTelegram(html: string, channel: string): TelegramPost[] {
  const blocks = html.split('tgme_widget_message_wrap').slice(1, 9);

  return blocks.flatMap((block) => {
    const postPath = block.match(/data-post="([^"]+)"/)?.[1];
    const textHtml = block.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/)?.[1];
    const datetime = block.match(/datetime="([^"]+)"/)?.[1];
    if (!postPath || !textHtml || !datetime) return [];

    const text = decodeEntities(textHtml);
    if (!text) return [];
    const [firstSentence = text] = text.split(/(?<=[.!?])\s+/);
    const title = firstSentence.length > 140 ? `${firstSentence.slice(0, 137)}…` : firstSentence;
    const body = text.slice(title.replace(/…$/, '').length).trim() || text;
    const date = new Date(datetime);

    return [{
      id: postPath.split('/').pop() || postPath,
      category: classify(text),
      title,
      text: body.length > 360 ? `${body.slice(0, 357)}…` : body,
      date: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }).format(date),
      time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Moscow' }).format(date),
      url: `https://t.me/${postPath || channel}`,
    }];
  });
}

export async function GET() {
  const channel = (process.env.TELEGRAM_CHANNEL || '').replace(/^@|https?:\/\/t\.me\//g, '').replace(/\/$/, '');
  const fetchedAt = new Date().toISOString();

  if (!channel) {
    return Response.json({ posts: demoPosts, source: 'demo', fetchedAt }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  }

  try {
    const response = await fetch(`https://t.me/s/${encodeURIComponent(channel)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketNote/1.0)' },
      cf: { cacheTtl: 60, cacheEverything: true },
    } as RequestInit & { cf: { cacheTtl: number; cacheEverything: boolean } });
    if (!response.ok) throw new Error(`Telegram returned ${response.status}`);
    const posts = parseTelegram(await response.text(), channel);
    if (!posts.length) throw new Error('No public posts found');

    return Response.json({ posts, source: 'telegram', channel, fetchedAt }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch {
    return Response.json({ posts: demoPosts, source: 'demo', channel, fetchedAt }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  }
}
