import { mkdir, stat, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { MAX_FILE_BYTES } from './feed.mjs';

export function telegramClient(token) {
  return async (method, body = {}) => {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
    });
    const data = await response.json();
    // Never log the request URL, token, response body or raw fetch exception.
    if (!data.ok) throw Object.assign(new Error(`Telegram API status ${data.error_code || response.status}`), { retryAfter: data.parameters?.retry_after });
    return data.result;
  };
}

export function safeMime(kind, path) {
  const ext = path.split('.').at(-1).toLowerCase();
  if (kind === 'photo') return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] || 'application/octet-stream';
  if (['video', 'animation', 'video_note'].includes(kind)) return { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif' }[ext] || 'application/octet-stream';
  if (['audio', 'voice'].includes(kind)) return { mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', oga: 'audio/ogg', wav: 'audio/wav' }[ext] || 'application/octet-stream';
  return 'application/octet-stream';
}

export async function downloadOne(file, { api, token, mediaDir, store, maxStorageBytes }) {
  const info = await api('getFile', { file_id: file.file_id });
  if (info.file_size > MAX_FILE_BYTES) return 'too_large';
  if (!info.file_path || !/^[a-zA-Z0-9_./-]+$/.test(info.file_path) || info.file_path.includes('..')) throw new Error('Unsafe path');
  const used = store.db.prepare("SELECT COALESCE(SUM(size),0) AS bytes FROM files WHERE status='ready'").get().bytes;
  if (used + Math.max(info.file_size || 0, MAX_FILE_BYTES) > maxStorageBytes) return 'storage_limit';
  const response = await fetch(`https://api.telegram.org/file/bot${token}/${info.file_path}`, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error('Download unavailable');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > MAX_FILE_BYTES) return 'too_large';
    chunks.push(chunk);
  }
  if (info.file_size && bytes !== info.file_size) throw new Error('Incomplete file');
  await writeFile(join(mediaDir, `${file.key}.part`), Buffer.concat(chunks), { mode: 0o600 });
  await rename(join(mediaDir, `${file.key}.part`), join(mediaDir, file.key));
  store.db.prepare('UPDATE files SET size=?,mime=? WHERE key=?').run(bytes, safeMime(file.kind, info.file_path), file.key);
  return 'ready';
}

export async function runBot({ token, store, mediaDir, channelId, signal, maxStorageBytes = 2 * 1024 ** 3 }) {
  const api = telegramClient(token);
  await mkdir(mediaDir, { recursive: true, mode: 0o700 });
  // Recover a missing file after a disk restore; updates themselves remain durable.
  for (const file of store.db.prepare("SELECT key FROM files WHERE status='ready'").all()) {
    try { await stat(join(mediaDir, file.key)); } catch { store.db.prepare("UPDATE files SET status='pending', attempts=0 WHERE key=?").run(file.key); }
  }
  const pause = ms => delay(ms, undefined, { signal }).catch(() => {});
  const mediaLoop = async () => {
    while (!signal.aborted) {
      const file = store.db.prepare("SELECT * FROM files WHERE status='pending' AND retry_at<=? ORDER BY retry_at LIMIT 1").get(Date.now());
      if (!file) { await pause(1500); continue; }
      try {
        const status = await downloadOne(file, { api, token, mediaDir, store, maxStorageBytes });
        store.db.prepare('UPDATE files SET status=? WHERE key=?').run(status, file.key);
      } catch {
        store.db.prepare('UPDATE files SET attempts=attempts+1,retry_at=? WHERE key=?').run(Date.now() + Math.min(3600000, 10000 * 2 ** Math.min(file.attempts, 8)), file.key);
        console.warn('Media download deferred; original post remains available.');
      }
    }
  };
  const pollingLoop = async () => {
    let verified = false;
    while (!signal.aborted) {
      try {
        if (!verified) {
          const webhook = await api('getWebhookInfo');
          if (webhook.url) throw new Error('Existing webhook; refusing to replace it');
          const me = await api('getMe');
          console.info(`Telegram bot @${me.username}; channel ${channelId}`);
          verified = true;
        }
        const updates = await api('getUpdates', { offset: Number(store.get('offset') || 0), timeout: 30, limit: 100, allowed_updates: ['channel_post', 'edited_channel_post', 'my_chat_member'] });
        for (const update of updates) store.ingest(update);
        store.set('last_poll', new Date().toISOString());
      } catch (error) {
        console.warn('Telegram polling unavailable; retrying without discarding stored updates.');
        await pause(Math.max(5000, Math.min(300000, (error.retryAfter || 0) * 1000)));
      }
    }
  };
  await Promise.all([pollingLoop(), mediaLoop()]);
}
