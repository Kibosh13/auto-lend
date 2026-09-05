export async function proxyAdmin(request: Request, resource: 'session' | 'posts') {
  const internalKey = process.env.ADMIN_INTERNAL_KEY;
  if (!internalKey) return Response.json({ error: 'Админ-панель доступна только на основном сайте' }, { status: 503 });
  try {
    const endpoint = new URL(`/admin/${resource}`, process.env.ADMIN_API_URL || 'http://127.0.0.1:3101');
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Internal-Admin-Key': internalKey,
      'X-Admin-Client': (request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown').slice(0, 120),
      'X-Admin-Secure': new URL(request.url).protocol === 'https:' ? '1' : '0',
    });
    const cookie = request.headers.get('cookie');
    const csrf = request.headers.get('x-csrf-token');
    if (cookie) headers.set('Cookie', cookie);
    if (csrf) headers.set('X-CSRF-Token', csrf);
    const response = await fetch(endpoint, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const outputHeaders = new Headers({
      'Content-Type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) outputHeaders.set('Set-Cookie', setCookie);
    return new Response(await response.text(), { status: response.status, headers: outputHeaders });
  } catch {
    return Response.json({ error: 'Сервис администрирования временно недоступен' }, { status: 503 });
  }
}
