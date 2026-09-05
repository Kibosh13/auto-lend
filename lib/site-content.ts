export type SiteContent = {
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoOgTitle: string;
  seoOgDescription: string;
  navReviews: string;
  navApproach: string;
  navContacts: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  latestNewLabel: string;
  latestEmptyLabel: string;
  latestFallbackTitle: string;
  latestOpenLabel: string;
  latestArchiveLabel: string;
  archiveEyebrow: string;
  archiveTitle: string;
  archiveDescription: string;
  archiveListLabel: string;
  archiveRefreshLabel: string;
  articleTelegramLabel: string;
  approachEyebrow: string;
  approachDescription: string;
  approachTitle: string;
  approachStep1Title: string;
  approachStep1Text: string;
  approachStep2Title: string;
  approachStep2Text: string;
  approachStep3Title: string;
  approachStep3Text: string;
  contactsEyebrow: string;
  contactsBio: string;
  contactsEmailLabel: string;
  contactsEmail: string;
  contactsIntro: string;
  contactsLinkLabel: string;
  contactsLinkUrl: string;
  contactsOutro: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaButton: string;
  footerLegal: string;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  logoUrl: '/brand-logo-transparent.png',
  faviconUrl: '/favicon.png',
  ogImageUrl: '/og.png',
  seoTitle: 'NG / Re:port — аналитика для энерготрейдеров',
  seoDescription: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — в удобном редакционном формате.',
  seoOgTitle: 'NG / Re:port — аналитика для энерготрейдеров',
  seoOgDescription: 'Ежедневные обзоры рынка, сигналы и сценарии из Telegram — без информационного шума.',
  navReviews: 'Обзоры',
  navApproach: 'Подход',
  navContacts: 'Контакты',
  heroEyebrow: 'Независимая аналитика для энерготрейдеров',
  heroTitle: 'Сигналы отрасли, которые конвертируются в торговый результат.',
  heroDescription: 'Короткие обзоры на американский и европейский природный газ, а также на нефть марки Brent. Факты, контекст и прогнозы — без лишнего новостного шума.',
  latestNewLabel: 'Свежий обзор',
  latestEmptyLabel: 'В фокусе издания',
  latestFallbackTitle: 'Природный газ и Brent: факты, контекст и прогнозы',
  latestOpenLabel: 'Перейти к обзору',
  latestArchiveLabel: 'К публикациям',
  archiveEyebrow: 'Архив публикаций',
  archiveTitle: 'Последние обзоры',
  archiveDescription: 'Новые записи из канала NG / Re:port: текст, графики и медиа в одном месте.',
  archiveListLabel: 'Публикации издания',
  archiveRefreshLabel: 'Обновить',
  articleTelegramLabel: 'Открыть в Telegram',
  approachEyebrow: 'Редакционный подход',
  approachDescription: 'Обзоры нашего информационно-аналитического издания помогают сделать один из сложнейших рыночных инструментов прозрачнее и яснее, а также подготовить план и собственную оценку риска.',
  approachTitle: 'От события — к понятной оценке и сценарию действия.',
  approachStep1Title: 'Отбираем факты',
  approachStep1Text: 'Оставляем только события, способные изменить цену или ожидания участников.',
  approachStep2Title: 'Проверяем реакцию',
  approachStep2Text: 'Сопоставляем новость с графиком, ликвидностью и поведением ключевых активов.',
  approachStep3Title: 'Фиксируем условия',
  approachStep3Text: 'Определяем триггер, условие отмены и диапазон, в котором идея сохраняет смысл.',
  contactsEyebrow: 'Контакты',
  contactsBio: 'Давид Абельман — специалист по нефтегазовому рынку, трейдер и редактор издания NG / Re:port.',
  contactsEmailLabel: 'E-mail:',
  contactsEmail: 'davidabelmane@gmail.com',
  contactsIntro: 'Вы также можете воспользоваться',
  contactsLinkLabel: 'закрытым разделом',
  contactsLinkUrl: 'https://t.me/+qbH6dGRpqBQ1ZmNi',
  contactsOutro: 'нашего издания, ориентированного на более широкое освещение рынка американского природного газа и нефти. В основе его работы лежит экспертная оценка отраслевых событий, авторские аналитические инструменты и индикаторы, а также оперативное информирование о новостях и факторах, влияющих на ценообразование нашего бенчмарка.',
  ctaEyebrow: 'Новые обзоры',
  ctaTitle: 'Следите за обновлениями в Telegram',
  ctaButton: 'Открыть Telegram',
  footerLegal: 'Материалы носят информационный характер и не являются индивидуальной инвестиционной рекомендацией. © 2026',
};

export function mergeSiteContent(value: unknown): SiteContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_SITE_CONTENT;
  const result = { ...DEFAULT_SITE_CONTENT };
  for (const key of Object.keys(result) as (keyof SiteContent)[]) {
    if (typeof (value as Record<string, unknown>)[key] === 'string') result[key] = (value as Record<string, string>)[key];
  }
  return result;
}
