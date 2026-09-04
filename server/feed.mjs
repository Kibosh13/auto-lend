import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

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
    PRAGMA user_version=1;`);
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
  function feed(offset = 0) {
    const groups = db.prepare('SELECT group_id, MIN(date) AS date FROM messages GROUP BY group_id ORDER BY date DESC, MIN(id) DESC LIMIT 21 OFFSET ?').all(offset);
    const more = groups.length > 20;
    const posts = groups.slice(0, 20).map(group => {
      const messages = db.prepare('SELECT * FROM messages WHERE group_id=? ORDER BY id').all(group.group_id);
      const text = [...new Set(messages.map(m => m.text).filter(Boolean))].join('\n\n');
      const firstLine = text.split('\n')[0];
      const title = firstLine ? (firstLine.length > 150 ? `${firstLine.slice(0, 147)}…` : firstLine) : 'Публикация с медиа';
      return {
        id: group.group_id, title, text: firstLine.length <= 150 ? text.slice(firstLine.length).trim() : text,
        publishedAt: new Date(group.date * 1000).toISOString(),
        url: `https://t.me/${channelName}/${messages[0].id}`,
        media: messages.flatMap(message => JSON.parse(message.media).map(key => {
          const file = db.prepare('SELECT key,kind,name,size,mime,status FROM files WHERE key=?').get(key);
          return { ...file, url: file.status === 'ready' ? `${origin}/media/${file.key}` : null };
        })),
      };
    });
    return { posts, source: 'telegram', fetchedAt: new Date().toISOString(), nextOffset: more ? offset + 20 : null };
  }
  return { db, get, set, ingest, feed, close: () => db.close() };
}
