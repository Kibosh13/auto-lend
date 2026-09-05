export async function GET() {
  try {
    const endpoint = new URL(process.env.FEED_API_URL || 'https://ngreport.ru/api/posts');
    endpoint.pathname = '/api/settings';
    endpoint.search = '';
    const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Settings unavailable');
    return Response.json(await response.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ settings: {} }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
