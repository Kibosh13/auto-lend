import test from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { createServer } from 'node:http';
import { openStore } from './feed.mjs';
import { createAdminApi } from './admin.mjs';
import { plainTextDocument, richDocumentText, validateRichDocument } from './content.mjs';
import { normalizeSiteSettings, SITE_SETTING_KEYS } from './settings.mjs';

const channel = '-1002151655824';
const message = (id, text = 'Исходный заголовок\nИсходный текст') => ({
  update_id: id, channel_post: { message_id: id, chat: { id: Number(channel), type: 'channel' }, date: 1700000000 + id, text },
});

test('rich content is normalized and unsafe structures are rejected', () => {
  const document = plainTextDocument('Первый абзац\nстрока\n\nВторой абзац');
  assert.equal(richDocumentText(document), 'Первый абзац\nстрока\n\nВторой абзац');
  assert.throws(() => validateRichDocument({ type: 'doc', content: [{ type: 'script', content: [] }] }), /Неподдерживаемый/);
  assert.throws(() => validateRichDocument({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] }), /ссылка/);
});

test('site drafts, publishing, Telegram edits, trash and restore are durable', () => {
  const store = openStore(':memory:', channel, 'ngreport');
  try {
    store.ingest(message(1));
    const telegram = store.feed().posts[0];
    store.saveTelegram({ id: telegram.id, title: 'Новый заголовок', content: plainTextDocument('Отредактированный текст') });
    assert.equal(store.feed().posts[0].title, 'Новый заголовок');
    assert.equal(store.feed().posts[0].text, 'Отредактированный текст');
    store.trash(telegram.id);
    assert.equal(store.feed().posts.length, 0);
    assert.equal(store.adminList()[0].status, 'trash');
    store.restore(telegram.id);
    assert.equal(store.feed().posts.length, 1);

    const id = store.saveManual({ title: 'Черновик', content: plainTextDocument('Только для редакции'), status: 'draft' });
    assert.equal(store.feed().posts.some(post => post.id === id), false);
    store.saveManual({ id, title: 'Отдельный обзор', content: plainTextDocument('Опубликованный текст'), status: 'published' });
    assert.equal(store.feed().posts.find(post => post.id === id).source, 'site');
    store.trash(id);
    assert.equal(store.feed().posts.some(post => post.id === id), false);
    store.restore(id);
    assert.equal(store.feed().posts.some(post => post.id === id), true);
  } finally { store.close(); }
});

test('site text and SEO settings are validated and saved', () => {
  const store = openStore(':memory:', channel, 'ngreport');
  const input = Object.fromEntries(SITE_SETTING_KEYS.map(key => [key, 'Текст']));
  Object.assign(input, {
    seoTitle: 'NG / Re:port — новый title', heroTitle: 'Новый заголовок',
    contactsEmail: 'editor@example.com', contactsLinkUrl: 'https://t.me/example',
    logoUrl: '/brand-logo-transparent.png', faviconUrl: '/favicon.png', ogImageUrl: 'https://ngreport.ru/og.png',
  });
  try {
    const saved = store.saveSiteSettings(input);
    assert.equal(saved.seoTitle, 'NG / Re:port — новый title');
    assert.deepEqual(store.siteSettings(), saved);
    assert.throws(() => normalizeSiteSettings({ ...input, unknown: 'field' }), /неизвестное/);
    assert.throws(() => normalizeSiteSettings({ ...input, contactsLinkUrl: 'javascript:alert(1)' }), /ссылку/);
    assert.throws(() => normalizeSiteSettings({ ...input, contactsEmail: 'not-an-email' }), /почты/);
  } finally { store.close(); }
});

test('admin API requires credentials, signed session and CSRF for changes', async t => {
  const store = openStore(':memory:', channel, 'ngreport');
  const salt = 'test-salt';
  const password = 'strong-test-password';
  const admin = createAdminApi(store, {
    username: 'admin', passwordSalt: salt, passwordHash: scryptSync(password, salt, 64).toString('hex'),
    sessionSecret: 'session-secret-for-tests-only', internalKey: 'internal-key-for-tests-only', now: () => 1800000000,
  });
  const server = createServer(async (req, res) => {
    try { if (!await admin.handle(req, res, new URL(req.url, 'http://localhost'))) res.writeHead(404).end(); }
    catch (error) { res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.close(); store.close(); });
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  const common = { 'Content-Type': 'application/json', 'X-Internal-Admin-Key': 'internal-key-for-tests-only' };
  assert.equal((await fetch(`${endpoint}/admin/posts`, { headers: common })).status, 401);
  assert.equal((await fetch(`${endpoint}/admin/session`, { method: 'POST', headers: common, body: JSON.stringify({ username: 'admin', password: 'wrong' }) })).status, 401);
  const login = await fetch(`${endpoint}/admin/session`, { method: 'POST', headers: common, body: JSON.stringify({ username: 'admin', password }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const { csrf } = await login.json();
  assert.equal((await fetch(`${endpoint}/admin/posts`, { method: 'POST', headers: { ...common, Cookie: cookie }, body: JSON.stringify({ title: 'Без CSRF', content: plainTextDocument('Текст') }) })).status, 403);
  const created = await fetch(`${endpoint}/admin/posts`, { method: 'POST', headers: { ...common, Cookie: cookie, 'X-CSRF-Token': csrf }, body: JSON.stringify({ title: 'Черновик', content: plainTextDocument('Текст'), status: 'draft' }) });
  assert.equal(created.status, 201);
  assert.equal((await (await fetch(`${endpoint}/admin/posts`, { headers: { ...common, Cookie: cookie } })).json()).posts.length, 1);
});
