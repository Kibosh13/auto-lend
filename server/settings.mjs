const LIMITS = {
  logoUrl: 2000, faviconUrl: 2000, ogImageUrl: 2000,
  seoTitle: 200, seoDescription: 320, seoOgTitle: 200, seoOgDescription: 320,
  navReviews: 40, navApproach: 40, navContacts: 40,
  heroEyebrow: 120, heroTitle: 240, heroDescription: 1200,
  latestNewLabel: 80, latestEmptyLabel: 80, latestFallbackTitle: 240, latestOpenLabel: 80, latestArchiveLabel: 80,
  archiveEyebrow: 120, archiveTitle: 160, archiveDescription: 800, archiveListLabel: 120, archiveRefreshLabel: 40,
  articleTelegramLabel: 80,
  approachEyebrow: 120, approachDescription: 1600, approachTitle: 240,
  approachStep1Title: 120, approachStep1Text: 600, approachStep2Title: 120, approachStep2Text: 600,
  approachStep3Title: 120, approachStep3Text: 600,
  contactsEyebrow: 120, contactsBio: 1000, contactsEmailLabel: 40, contactsEmail: 254,
  contactsIntro: 500, contactsLinkLabel: 120, contactsLinkUrl: 2000, contactsOutro: 2200,
  ctaEyebrow: 120, ctaTitle: 240, ctaButton: 80, footerLegal: 800,
};
export const SITE_SETTING_KEYS = Object.freeze(Object.keys(LIMITS));

export function normalizeSiteSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Некорректные настройки сайта');
  const unknown = Object.keys(input).filter(key => !Object.hasOwn(LIMITS, key));
  if (unknown.length) throw new Error('Обнаружено неизвестное поле настроек');
  const clean = {};
  for (const [key, limit] of Object.entries(LIMITS)) {
    const value = input[key];
    if (typeof value !== 'string' || value.length > limit) throw new Error(`Некорректное значение поля ${key}`);
    clean[key] = value.trim();
  }
  if (!clean.seoTitle || !clean.heroTitle) throw new Error('SEO-заголовок и заголовок первого экрана не могут быть пустыми');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.contactsEmail)) throw new Error('Проверьте адрес электронной почты');
  for (const key of ['logoUrl', 'faviconUrl', 'ogImageUrl']) {
    try {
      const url = new URL(clean[key], 'https://ngreport.ru');
      if (!['http:', 'https:'].includes(url.protocol) || clean[key].startsWith('//')) throw new Error();
    } catch { throw new Error('Проверьте адрес изображения'); }
  }
  try {
    const url = new URL(clean.contactsLinkUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch { throw new Error('Проверьте ссылку закрытого раздела'); }
  return clean;
}
