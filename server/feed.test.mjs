import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, normalize, MAX_FILE_BYTES } from './feed.mjs';
import { downloadOne, safeMime } from './telegram.mjs';

const channel = '-1002151655824';
const message = (id, extra = {}) => ({ message_id: id, chat: { id: Number(channel), type: 'channel' }, date: 1700000000 + id, text: 'Заголовок\nТекст обзора', ...extra });
test('only the configured public channel is accepted', () => {
  assert.equal(normalize(message(1, { chat: { id: 1, type: 'channel' } }), channel), null);
  assert.equal(normalize(message(1, { chat: { id: Number(channel), type: 'private' } }), channel), null);
  assert.equal(normalize(message(1, { text: undefined }), channel), null);
});
test('durable, idempotent updates; edited captions; albums; no private data in API', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ngreport-test-'));
  let store = openStore(join(dir, 'test.sqlite'), channel, 'ngreport');
  try {
    assert.deepEqual(store.feed().posts, []);
    const post = { update_id: 10, channel_post: message(1) };
    store.ingest(post); store.ingest(post);
    assert.equal(store.feed().posts.length, 1);
    store.ingest({ update_id: 11, edited_channel_post: message(1, { edit_date: 1800000000, text: 'Исправлено\n<script>alert(1)</script>' }) });
    store.ingest(post);
    assert.equal(store.feed().posts[0].title, 'Исправлено');
    assert.equal(store.feed().posts[0].text, '<script>alert(1)</script>');
    const photo = [{ file_id: 'PRIVATE_FILE_ID', file_unique_id: 'unique-photo', file_size: 500 }];
    store.ingest({ update_id: 12, channel_post: message(2, { text: undefined, caption: 'Альбом', media_group_id: 'abc', photo }) });
    store.ingest({ update_id: 13, channel_post: message(3, { text: undefined, media_group_id: 'abc', video: { file_id: 'PRIVATE_VIDEO_ID', file_unique_id: 'unique-video', file_size: MAX_FILE_BYTES + 1 } }) });
    const feed = store.feed();
    assert.equal(feed.posts.length, 2);
    assert.equal(feed.posts[0].media.length, 2);
    assert.equal(feed.posts[0].media[1].status, 'too_large');
    assert.equal(feed.posts[0].media[1].url, null);
    assert.equal(JSON.stringify(feed).includes('PRIVATE_'), false);
    store.ingest({ update_id: 14, channel_post: message(10, { chat: { id: 99, type: 'private' }, text: 'PRIVATE MESSAGE' }) });
    assert.equal(store.get('offset'), '15');
    assert.equal(store.feed().posts.length, 2);
    store.close();
    store = openStore(join(dir, 'test.sqlite'), channel, 'ngreport');
    assert.equal(store.get('offset'), '15');
    assert.equal(store.feed().posts.length, 2);
  } finally { store.close(); await rm(dir, { recursive: true }); }
});
test('pagination and restricted media MIME', () => {
  const store = openStore(':memory:', channel, 'ngreport');
  try {
    for (let id = 1; id <= 25; id++) store.ingest({ update_id: id, channel_post: message(id) });
    assert.equal(store.feed().posts.length, 20);
    assert.equal(store.feed().nextOffset, 20);
    assert.equal(store.feed(20).posts.length, 5);
    assert.equal(store.feed(20).nextOffset, null);
    assert.equal(safeMime('document', 'file.html'), 'application/octet-stream');
    assert.equal(safeMime('photo', 'file.svg'), 'application/octet-stream');
    assert.equal(safeMime('video', 'video.mp4'), 'video/mp4');
  } finally { store.close(); }
});
test('media download is local, bounded, and uses a safe content type', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'ngreport-media-test-'));
  const store = openStore(':memory:', channel, 'ngreport');
  const bytes = Buffer.from([255, 216, 255, 217]);
  t.mock.method(globalThis, 'fetch', async () => new Response(bytes));
  try {
    store.ingest({ update_id: 1, channel_post: message(1, { photo: [{ file_id: 'private-file', file_unique_id: 'photo', file_size: bytes.length }] }) });
    const file = store.db.prepare('SELECT * FROM files').get();
    const settings = { api: async () => ({ file_size: bytes.length, file_path: 'photos/file.jpg' }), token: 'test-only', mediaDir: dir, store, maxStorageBytes: 100 * 1024 ** 2 };
    assert.equal(await downloadOne(file, settings), 'ready');
    assert.deepEqual(await readFile(join(dir, file.key)), bytes);
    assert.equal(store.db.prepare('SELECT mime FROM files').get().mime, 'image/jpeg');
    assert.equal(await downloadOne(file, { ...settings, api: async () => ({ file_size: MAX_FILE_BYTES + 1 }) }), 'too_large');
    assert.equal(await downloadOne(file, { ...settings, maxStorageBytes: 1 }), 'storage_limit');
    await assert.rejects(downloadOne(file, { ...settings, api: async () => ({ file_path: '../secret' }) }));
    t.mock.method(globalThis, 'fetch', async () => new Response(bytes.subarray(0, 2)));
    await assert.rejects(downloadOne(file, settings));
  } finally { store.close(); await rm(dir, { recursive: true }); }
});
