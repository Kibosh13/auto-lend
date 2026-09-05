# Production: ngreport.ru

The main site is a Vinext Node standalone build. Telegram ingestion runs in a
separate Node 24 service using SQLite, not in GitHub Pages or the browser.

## Layout

- Website: `/opt/ngreport/current/web`, loopback port 3100.
- Bot/read API: `/opt/ngreport/current/server`, loopback port 3101.
- Durable database and downloaded files: `/var/lib/ngreport` (not a release).
- Feed and login secrets: `/etc/ngreport.env`; the web service receives only its
  internal admin key through `/etc/ngreport-web.env`. Both are root-owned mode 600.
- Services: `ngreport-web`, `ngreport-feed`, both run as unprivileged `ngreport`.
- Nginx serves only `ngreport.ru` and `www.ngreport.ru`; other VPS sites stay intact.

## Telegram

Add **@ngreport1bot** to **@ngreport** as an administrator. Posting, deleting
messages and inviting administrators are not required. The service accepts only
numeric channel ID `-1002151655824`; private messages and other channels are ignored.
Publish a real new channel post after adding the bot to verify delivery.

Text, photos, albums, videos/animations, audio/voice notes and documents are
supported. Edits replace the stored message; duplicate deliveries do not duplicate
posts. Files are downloaded server-side and the bot token/file IDs never appear
in the feed. Public endpoints are read-only. HTML is rendered as text, documents
download as attachments, and unknown MIME types cannot execute inline.

## Editorial panel

`/admin` is excluded from search indexing and protected by a signed, HTTP-only,
same-site session cookie. The password itself is never stored: the feed service
keeps only a scrypt salt and hash. Login attempts are rate-limited; write actions
also require a per-session CSRF value. `/etc/ngreport-web.env` contains only the
random internal key used by the public web process to reach the loopback admin API.

Editors can create site-only drafts and publications, modify Telegram copies, and
move either kind to a recoverable trash. Rich content is stored as validated JSON
with an allowlist of headings, paragraphs, lists, quotes, links and basic marks;
arbitrary HTML and script URLs are rejected. Telegram originals and media remain
unchanged when their website copy is edited.

Limitations of the public Telegram Bot API:

- No automatic channel-history import; it delivers new posts and edits after the
  bot is added. Pending updates are retained by Telegram for at most 24 hours.
- Files over **20 MB** are linked to the original Telegram post, not downloaded.
- Total downloaded media is capped at **2 GiB** to protect this 10 GB VPS. At the
  cap, further attachments link to Telegram. Increase capacity before raising it.
- Telegram does not send ordinary channel-post deletion events; deleting a post
  in Telegram does not remove the stored website copy. Move its website copy to
  the recoverable trash in `/admin` when needed. The service does not create test posts.
- Telegram formatting/entities are presented as plain readable text; media has
  no auto-generated subtitles or transcripts. Polls/stickers are not reproduced.

Reference: https://core.telegram.org/bots/api and https://core.telegram.org/bots/faq

## Updates

Run `npm ci`, `npm run test:feed`, `npx tsc --noEmit`, `npm run lint`, and
`npm run build:node`. Package `dist/standalone` with `COPYFILE_DISABLE=1 tar
--no-xattrs` on macOS, plus `server/*.mjs` (exclude tests). Upload to a **new**
release directory, point `/opt/ngreport/current` at it atomically, and restart the
two services. Never replace `/var/lib/ngreport` or `/etc/ngreport.env` on deploy.
Keep the previous release to allow rollback. No source archive or build artifacts
belong in Git. The default `npm run build` still creates the Sites worker mirror.

Check `systemctl is-active ngreport-web ngreport-feed`,
`curl http://127.0.0.1:3101/health`, the public page, `/admin` and `/api/posts`.
`lastPoll` should update at least every minute even when the channel is quiet.
Only one service may long-poll this bot; do not run a second copy or configure a
webhook simultaneously. Logs intentionally omit credentials and message bodies.

## Backups and credentials

Back up the SQLite DB using SQLite's online backup or `VACUUM INTO` (do not copy
only the live .sqlite file while omitting its WAL). Back up the media directory
with it. Store an encrypted copy off this VPS; a same-server copy is not disaster
recovery. Hosting snapshots/off-server backups are not purchased automatically.
Credentials originally shared in chat should be rotated by their owner. After
rotating the Telegram token or admin password hash, update `/etc/ngreport.env` and
restart only the feed service. Keep the matching internal key in
`/etc/ngreport-web.env`. No password or token is recorded in this repository.

The GitHub Pages version is deliberately static and empty of example news;
it links to production, and retains its noindex directives. The Sites preview
uses the same real production feed, without direct access to bot credentials.
