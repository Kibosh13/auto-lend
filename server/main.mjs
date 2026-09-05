import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { openStore } from './feed.mjs';
import { runBot } from './telegram.mjs';
import { createAdminApi } from './admin.mjs';

const dataDir = resolve(process.env.DATA_DIR || './data');
await mkdir(dataDir, { recursive: true, mode: 0o700 });
const mediaDir = join(dataDir, 'media');
const siteAssetDir = join(dataDir, 'site-assets');
const channelId = process.env.TELEGRAM_CHANNEL_ID;
if (!channelId || !process.env.TELEGRAM_BOT_TOKEN) throw new Error('Required server configuration missing');
const store = openStore(join(dataDir, 'feed.sqlite'), channelId, process.env.TELEGRAM_CHANNEL || 'ngreport', process.env.PUBLIC_ORIGIN || 'https://ngreport.ru');
const admin = createAdminApi(store, { assetDir: siteAssetDir, publicOrigin: process.env.PUBLIC_ORIGIN });
const abort = new AbortController();
const server = createServer(async (req, res) => {
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const url = new URL(req.url, 'http://localhost');
    if (await admin.handle(req, res, url)) return;
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    if (url.pathname === '/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, lastPoll: store.get('last_poll') || null })); return;
    }
    if (url.pathname === '/api/posts') {
      const offset = Number(url.searchParams.get('offset') || 0);
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) { res.writeHead(400).end(); return; }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify(store.feed(offset))); return;
    }
    if (url.pathname === '/api/settings') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ settings: store.siteSettings() })); return;
    }
    const siteAssetKey = /^\/site-assets\/([a-f0-9]{64})$/.exec(url.pathname)?.[1];
    if (siteAssetKey) {
      const asset = store.siteAsset(siteAssetKey);
      if (!asset) { res.writeHead(404).end(); return; }
      const path = join(siteAssetDir, siteAssetKey);
      const { size } = await stat(path);
      res.writeHead(200, { 'Content-Type': asset.mime, 'Content-Length': size, 'Cache-Control': 'public, max-age=31536000, immutable', 'Content-Security-Policy': "default-src 'none'; sandbox" });
      if (req.method === 'HEAD') res.end(); else createReadStream(path).pipe(res);
      return;
    }
    const key = /^\/media\/([a-f0-9]{64})$/.exec(url.pathname)?.[1];
    const file = key && store.db.prepare("SELECT * FROM files WHERE key=? AND status='ready'").get(key);
    if (!file) { res.writeHead(404).end(); return; }
    const path = join(mediaDir, key);
    const { size } = await stat(path);
    const headers = { 'Content-Type': file.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes', 'Content-Security-Policy': "default-src 'none'; sandbox" };
    if (file.kind === 'document' || file.mime === 'application/octet-stream') headers['Content-Disposition'] = `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(file.name || 'download').replace(/'/g, '%27')}`;
    let start = 0, end = size - 1, status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
      if (!match[1]) start = Math.max(0, size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (start > end || start >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`; status = 206;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') res.end();
    else { const stream = createReadStream(path, { start, end }); stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res); }
  } catch { if (!res.headersSent) res.writeHead(503); res.end(); }
});
server.listen(Number(process.env.FEED_PORT || 3101), '127.0.0.1', () => console.info('Feed service listening on loopback'));
void runBot({ token: process.env.TELEGRAM_BOT_TOKEN, store, mediaDir, channelId, signal: abort.signal }).catch(() => { console.error('Feed worker stopped'); process.exit(1); });
function stop() { abort.abort(); server.close(); setTimeout(() => process.exit(0), 1000).unref(); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
