import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decodeSiteAsset } from './site-assets.mjs';

const COOKIE = 'ngreport_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_BODY_BYTES = 1024 * 1024;

function equalSecret(actual, expected) {
  if (!actual || !expected) return false;
  const a = Buffer.from(String(actual));
  const b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

function cookies(header = '') {
  return Object.fromEntries(header.split(';').map(value => value.trim().split(/=(.*)/s)).filter(parts => parts.length > 1));
}

async function readJson(req, maxBytes = MAX_BODY_BYTES) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Запрос слишком большой');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw new Error('Некорректный запрос'); }
}

export function createAdminApi(store, config = {}) {
  const username = config.username || process.env.ADMIN_USERNAME;
  const passwordSalt = config.passwordSalt || process.env.ADMIN_PASSWORD_SALT;
  const passwordHash = config.passwordHash || process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = config.sessionSecret || process.env.ADMIN_SESSION_SECRET;
  const internalKey = config.internalKey || process.env.ADMIN_INTERNAL_KEY;
  const assetDir = config.assetDir;
  const publicOrigin = String(config.publicOrigin || process.env.PUBLIC_ORIGIN || 'https://ngreport.ru').replace(/\/$/, '');
  const now = config.now || (() => Math.floor(Date.now() / 1000));
  const failures = new Map();

  function configured() {
    return [username, passwordSalt, passwordHash, sessionSecret, internalKey].every(Boolean);
  }
  function sign(encoded) {
    return createHmac('sha256', sessionSecret).update(encoded).digest('base64url');
  }
  function issueSession() {
    const payload = Buffer.from(JSON.stringify({ exp: now() + SESSION_SECONDS, csrf: cryptoRandom() })).toString('base64url');
    return { token: `${payload}.${sign(payload)}`, csrf: JSON.parse(Buffer.from(payload, 'base64url')).csrf };
  }
  function cryptoRandom() {
    return randomBytes(24).toString('base64url');
  }
  function verifySession(req) {
    const token = cookies(req.headers.cookie)[COOKIE];
    const [encoded, signature, extra] = String(token || '').split('.');
    if (!encoded || !signature || extra || !equalSecret(signature, sign(encoded))) return null;
    try {
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      return Number.isSafeInteger(payload.exp) && payload.exp > now() && typeof payload.csrf === 'string' ? payload : null;
    } catch { return null; }
  }
  function setCookie(res, value, secure = false) {
    res.setHeader('Set-Cookie', `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${value ? SESSION_SECONDS : 0}${secure ? '; Secure' : ''}`);
  }
  function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' });
    res.end(JSON.stringify(body));
  }
  function authorizedMutation(req, session) {
    return session && equalSecret(req.headers['x-csrf-token'], session.csrf);
  }

  async function handle(req, res, url) {
    if (!url.pathname.startsWith('/admin/')) return false;
    try {
    if (!configured() || !equalSecret(req.headers['x-internal-admin-key'], internalKey)) { json(res, 503, { error: 'Сервис администрирования недоступен' }); return true; }
    if (url.pathname === '/admin/session') {
      if (req.method === 'POST') {
        const client = String(req.headers['x-admin-client'] || 'unknown').slice(0, 120);
        const current = failures.get(client);
        if (current?.until > now() && current.count >= 5) { json(res, 429, { error: 'Слишком много попыток. Попробуйте через 15 минут.' }); return true; }
        const body = await readJson(req);
        const suppliedPassword = typeof body.password === 'string' && body.password.length <= 256 ? body.password : '';
        let candidate = Buffer.alloc(64);
        try { candidate = scryptSync(suppliedPassword, passwordSalt, 64); } catch { /* invalid credentials */ }
        const expected = Buffer.from(passwordHash, 'hex');
        const valid = body.username === username && candidate.length === expected.length && timingSafeEqual(candidate, expected);
        if (!valid) {
          const count = current?.until > now() ? current.count + 1 : 1;
          failures.set(client, { count, until: now() + 15 * 60 });
          json(res, 401, { error: 'Неверный логин или пароль' }); return true;
        }
        failures.delete(client);
        const session = issueSession();
        setCookie(res, session.token, req.headers['x-admin-secure'] === '1');
        json(res, 200, { authenticated: true, csrf: session.csrf }); return true;
      }
      const session = verifySession(req);
      if (req.method === 'GET') { json(res, session ? 200 : 401, session ? { authenticated: true, csrf: session.csrf } : { authenticated: false }); return true; }
      if (req.method === 'DELETE') {
        if (!authorizedMutation(req, session)) { json(res, 403, { error: 'Сессия недействительна' }); return true; }
        setCookie(res, '', req.headers['x-admin-secure'] === '1');
        json(res, 200, { authenticated: false }); return true;
      }
      json(res, 405, { error: 'Метод не поддерживается' }); return true;
    }
    if (url.pathname === '/admin/posts') {
      const session = verifySession(req);
      if (!session) { json(res, 401, { error: 'Требуется вход' }); return true; }
      if (req.method === 'GET') { json(res, 200, { posts: store.adminList() }); return true; }
      if (!authorizedMutation(req, session)) { json(res, 403, { error: 'Обновите страницу и повторите действие' }); return true; }
      const body = await readJson(req);
      if (req.method === 'POST') {
        const id = store.saveManual(body); json(res, 201, { ok: true, id }); return true;
      }
      if (req.method === 'PUT') {
        const id = body.source === 'telegram' ? store.saveTelegram(body) : store.saveManual(body);
        json(res, 200, { ok: true, id }); return true;
      }
      if (req.method === 'DELETE') { store.trash(body.id); json(res, 200, { ok: true }); return true; }
      if (req.method === 'PATCH' && body.action === 'restore') { store.restore(body.id); json(res, 200, { ok: true }); return true; }
      json(res, 405, { error: 'Метод не поддерживается' }); return true;
    }
    if (url.pathname === '/admin/settings') {
      const session = verifySession(req);
      if (!session) { json(res, 401, { error: 'Требуется вход' }); return true; }
      if (req.method === 'GET') { json(res, 200, { settings: store.siteSettings() }); return true; }
      if (req.method !== 'PUT') { json(res, 405, { error: 'Метод не поддерживается' }); return true; }
      if (!authorizedMutation(req, session)) { json(res, 403, { error: 'Обновите страницу и повторите действие' }); return true; }
      const settings = store.saveSiteSettings(await readJson(req));
      json(res, 200, { ok: true, settings }); return true;
    }
    if (url.pathname === '/admin/assets') {
      const session = verifySession(req);
      if (!session) { json(res, 401, { error: 'Требуется вход' }); return true; }
      if (req.method !== 'POST') { json(res, 405, { error: 'Метод не поддерживается' }); return true; }
      if (!authorizedMutation(req, session)) { json(res, 403, { error: 'Обновите страницу и повторите действие' }); return true; }
      if (!assetDir) throw new Error('Хранилище изображений недоступно');
      const asset = decodeSiteAsset(await readJson(req, 6 * 1024 * 1024));
      await mkdir(assetDir, { recursive: true, mode: 0o700 });
      await writeFile(join(assetDir, asset.key), asset.bytes, { mode: 0o600, flag: 'wx' }).catch(error => {
        if (error?.code !== 'EEXIST') throw error;
      });
      store.saveSiteAsset({ key: asset.key, kind: asset.kind, mime: asset.mime, size: asset.bytes.length });
      json(res, 201, { ok: true, url: `${publicOrigin}/site-assets/${asset.key}` }); return true;
    }
    json(res, 404, { error: 'Не найдено' }); return true;
    } catch (error) {
      if (!res.headersSent) json(res, 400, { error: error instanceof Error ? error.message : 'Некорректный запрос' });
      else res.end();
      return true;
    }
  }
  return { handle, issueSession, verifySession };
}
