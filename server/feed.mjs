import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { normalizePostInput, plainTextDocument, richDocumentText } from './content.mjs';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export function normalize(message, channelId) {
  if (!message || message.chat?.type !== 'channel' || String(message.chat.id) !== String(channelId)) return null;
  const media = [];
  const add = (kind, file) => {
    if (!file?.file_id) return;
    media.push({
      key: createHash('sha256').update(`${kind}:${file.file_unique_id || file.file_id}`).digest('hex'),
      kind, fileId: file.file_id, size: file.file_size || 0,
      name: (file.file_name || '').slice(0, 200), mime: file.mime_type || '',
    });
  };
  if (message.photo?.length) add('photo', message.photo.at(-1));
  for (const kind of ['video', 'animation', 'audio', 'voice', 'document', 'video_note']) add(kind, message[kind]);
  if (!message.text && !message.caption && !media.length) return null;
  return {
    id: message.message_id, group: message.media_group_id ? `album-${message.media_group_id}` : `post-${message.message_id}`,
    date: message.date, version: message.edit_date || message.date,
    text: message.text || message.caption || '', media,
  };
}

export function openStore(filename, channelId, channelName, origin = 'https://ngreport.ru') {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, group_id TEXT NOT NULL, date INTEGER NOT NULL, version INTEGER NOT NULL, text TEXT NOT NULL, media TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_group ON messages(group_id);
    CREATE TABLE IF NOT EXISTS files (key TEXT PRIMARY KEY, kind TEXT NOT NULL, file_id TEXT NOT NULL, name TEXT NOT NULL, size INTEGER NOT NULL, mime TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, retry_at INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS manual_posts (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, published_at INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft','published','trash')),
      previous_status TEXT NOT NULL DEFAULT 'draft' CHECK(previous_status IN ('draft','published')),
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS post_overrides (
      post_id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','trash')), updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_manual_posts_status_published ON manual_posts(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_post_overrides_status ON post_overrides(status);
    PRAGMA user_version=2; PRAGMA optimize;`);
  const get = (key) => db.prepare('SELECT value FROM state WHERE key=?').get(key)?.value;
  const set = (key, value) => db.prepare('INSERT INTO state VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, String(value));
  function ingest(update) {
    const post = normalize(update.channel_post || update.edited_channel_post, channelId);
    db.exec('BEGIN IMMEDIATE');
    try {
      if (post) {
        const previous = db.prepare('SELECT version FROM messages WHERE id=?').get(post.id);
        if (!previous || previous.version <= post.version) {
          for (const file of post.media) {
            db.prepare('INSERT INTO files (key,kind,file_id,name,size,mime,status) VALUES (?,?,?,?,?,?,?) ON CONFLICT(key) DO NOTHING').run(
              file.key, file.kind, file.fileId, file.name, file.size, file.mime, file.size > MAX_FILE_BYTES ? 'too_large' : 'pending');
          }
          db.prepare('INSERT INTO messages VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET group_id=excluded.group_id,date=excluded.date,version=excluded.version,text=excluded.text,media=excluded.media').run(
            post.id, post.group, post.date, post.version, post.text, JSON.stringify(post.media.map(f => f.key)));
        }
      }
      set('offset', Math.max(Number(get('offset') || 0), update.update_id + 1));
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function telegramPosts(includeTrash = false) {
    const groups = db.prepare('SELECT group_id, MIN(date) AS date FROM messages GROUP BY group_id ORDER BY date DESC, MIN(id) DESC').all();
    return groups.map(group => {
      const messages = db.prepare('SELECT * FROM messages WHERE group_id=? ORDER BY id').all(group.group_id);
      const text = [...new Set(messages.map(m => m.text).filter(Boolean))].join('\n\n');
      const firstLine = text.split('\n')[0];
      const title = firstLine ? (firstLine.length > 150 ? `${firstLine.slice(0, 147)}…` : firstLine) : 'Публикация с медиа';
      const body = firstLine.length <= 150 ? text.slice(firstLine.length).trim() : text;
      const override = db.prepare('SELECT * FROM post_overrides WHERE post_id=?').get(group.group_id);
      if (override?.status === 'trash' && !includeTrash) return null;
      const content = override ? JSON.parse(override.content) : plainTextDocument(body);
      return {
        id: group.group_id, title: override?.title || title, text: override ? richDocumentText(content) : body, content,
        publishedAt: new Date(group.date * 1000).toISOString(),
        url: `https://t.me/${channelName}/${messages[0].id}`,
        source: 'telegram', status: override?.status || 'published', updatedAt: override?.updated_at || group.date,
        media: messages.flatMap(message => JSON.parse(message.media).map(key => {
          const file = db.prepare('SELECT key,kind,name,size,mime,status FROM files WHERE key=?').get(key);
          return { ...file, url: file.status === 'ready' ? `${origin}/media/${file.key}` : null };
        })),
      };
    }).filter(Boolean);
  }
  function manualPosts(includeUnpublished = false) {
    const where = includeUnpublished ? '' : "WHERE status='published'";
    return db.prepare(`SELECT * FROM manual_posts ${where}`).all().map(row => {
      const content = JSON.parse(row.content);
      return {
        id: row.id, title: row.title, text: richDocumentText(content), content,
        publishedAt: new Date(row.published_at * 1000).toISOString(), url: null, media: [], source: 'site',
        status: row.status, previousStatus: row.previous_status, createdAt: row.created_at, updatedAt: row.updated_at,
      };
    });
  }
  function feed(offset = 0) {
    const all = [...telegramPosts(), ...manualPosts()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    const posts = all.slice(offset, offset + 20);
    const more = all.length > offset + 20;
    return { posts, source: 'telegram', fetchedAt: new Date().toISOString(), nextOffset: more ? offset + 20 : null };
  }
  function adminList() {
    return [...telegramPosts(true), ...manualPosts(true)].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  function saveManual(input) {
    const clean = normalizePostInput(input);
    const status = ['draft', 'published'].includes(input.status) ? input.status : 'draft';
    const now = Math.floor(Date.now() / 1000);
    const id = typeof input.id === 'string' && /^site-[a-f0-9-]{36}$/.test(input.id) ? input.id : `site-${randomUUID()}`;
    const existing = db.prepare('SELECT * FROM manual_posts WHERE id=?').get(id);
    if (input.id && !existing) throw new Error('Публикация не найдена');
    if (existing) {
      const publishedAt = existing.status !== 'published' && status === 'published' ? now : existing.published_at;
      db.prepare('UPDATE manual_posts SET title=?,content=?,published_at=?,status=?,previous_status=?,updated_at=? WHERE id=?').run(
        clean.title, JSON.stringify(clean.content), publishedAt, status, status, now, id);
    } else {
      db.prepare('INSERT INTO manual_posts VALUES (?,?,?,?,?,?,?,?)').run(id, clean.title, JSON.stringify(clean.content), now, status, status, now, now);
    }
    return id;
  }
  function saveTelegram(input) {
    if (typeof input.id !== 'string' || !/^(post-|album-).+/.test(input.id) || !telegramPosts(true).some(post => post.id === input.id)) throw new Error('Публикация не найдена');
    const clean = normalizePostInput(input);
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO post_overrides (post_id,title,content,status,updated_at) VALUES (?,?,?,'published',?)
      ON CONFLICT(post_id) DO UPDATE SET title=excluded.title,content=excluded.content,status='published',updated_at=excluded.updated_at`).run(
      input.id, clean.title, JSON.stringify(clean.content), now);
    return input.id;
  }
  function trash(id) {
    const now = Math.floor(Date.now() / 1000);
    const manual = db.prepare('SELECT * FROM manual_posts WHERE id=?').get(id);
    if (manual) {
      if (manual.status !== 'trash') db.prepare("UPDATE manual_posts SET previous_status=status,status='trash',updated_at=? WHERE id=?").run(now, id);
      return;
    }
    const post = telegramPosts(true).find(item => item.id === id);
    if (!post) throw new Error('Публикация не найдена');
    db.prepare(`INSERT INTO post_overrides (post_id,title,content,status,updated_at) VALUES (?,?,?,'trash',?)
      ON CONFLICT(post_id) DO UPDATE SET status='trash',updated_at=excluded.updated_at`).run(id, post.title, JSON.stringify(post.content), now);
  }
  function restore(id) {
    const now = Math.floor(Date.now() / 1000);
    const manual = db.prepare('SELECT * FROM manual_posts WHERE id=?').get(id);
    if (manual) {
      db.prepare('UPDATE manual_posts SET status=previous_status,updated_at=? WHERE id=?').run(now, id); return;
    }
    const result = db.prepare("UPDATE post_overrides SET status='published',updated_at=? WHERE post_id=?").run(now, id);
    if (!result.changes) throw new Error('Публикация не найдена');
  }
  return { db, get, set, ingest, feed, adminList, saveManual, saveTelegram, trash, restore, close: () => db.close() };
}
