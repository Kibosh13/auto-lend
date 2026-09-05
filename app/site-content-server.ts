import { DEFAULT_SITE_CONTENT, mergeSiteContent } from '@/lib/site-content';

export async function loadSiteContent() {
  try {
    const response = await fetch(process.env.SITE_SETTINGS_API_URL || 'https://ngreport.ru/api/settings', {
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Settings unavailable');
    const data = await response.json() as { settings?: unknown };
    return mergeSiteContent(data.settings);
  } catch { return DEFAULT_SITE_CONTENT; }
}
