// Bot credentials are isolated in the ingestion service, never in this app.
export async function GET(request: Request) {
  try {
    const endpoint = new URL(process.env.FEED_API_URL || 'https://ngreport.ru/api/posts');
    endpoint.searchParams.set('offset', new URL(request.url).searchParams.get('offset') || '0');
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Feed unavailable');
    return Response.json(await response.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ posts: [], source: 'telegram', error: 'Лента временно недоступна' }, { status: 503 });
  }
}
