'use client';

import Image from 'next/image';
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, FileText, Heading2, Heading3, Italic, Link2, List, ListOrdered, LoaderCircle,
  LogOut, Minus, Newspaper, Pilcrow, Plus, Quote, Redo2, RotateCcw, Save,
  Settings2, Strikethrough, Trash2, Underline, Undo2, Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { RichDocument } from '../rich-text';
import { DEFAULT_SITE_CONTENT, mergeSiteContent, type SiteContent } from '@/lib/site-content';
import { SETTINGS_GROUPS, SiteSettingsEditor } from './site-settings-editor';

type Status = 'draft' | 'published' | 'trash';
type AdminPost = {
  id: string; title: string; content: RichDocument; publishedAt: string; source: 'telegram' | 'site';
  status: Status; url: string | null; media: unknown[];
};
type Filter = 'all' | Status;
const blankDocument = (): RichDocument => ({ type: 'doc', content: [{ type: 'paragraph' }] });

async function api<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, { cache: 'no-store', ...init });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие');
  return data;
}

function Logo() {
  return <NextLink href="/" className="brand-logo-crop" aria-label="NG / Re:port — на сайт">
    <Image src="/brand-logo-transparent.png" alt="natural gas RE:PORT" width="1280" height="668" priority />
  </NextLink>;
}

function Login({ onLogin }: { onLogin: (csrf: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ csrf: string }>('/api/admin/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
      });
      onLogin(result.csrf);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось войти'); }
    finally { setBusy(false); }
  }
  return <main className="admin-login-shell">
    <section className="admin-login-card" aria-labelledby="login-title">
      <Logo />
      <p className="eyebrow mt-10">Редакционный доступ</p>
      <h1 id="login-title" className="mt-4 font-serif text-4xl leading-none tracking-[-0.035em]">Вход в редакцию</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">Управление обзорами NG / Re:port.</p>
      <form onSubmit={submit} className="mt-9 grid gap-5">
        <div className="grid gap-2"><Label htmlFor="username">Логин</Label><Input id="username" name="username" autoComplete="username" required className="h-11 rounded-none" /></div>
        <div className="grid gap-2"><Label htmlFor="password">Пароль</Label><Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11 rounded-none" /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-2 h-11 rounded-none">
          {busy && <LoaderCircle className="animate-spin" />} Войти
        </Button>
      </form>
      <NextLink href="/" className="mt-8 inline-block text-xs text-muted-foreground underline decoration-border underline-offset-4">Вернуться на сайт</NextLink>
    </section>
  </main>;
}

function ToolButton({ active = false, label, onClick, disabled, children }: { active?: boolean; label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick} className="editor-tool">{children}</button>;
}

function PostEditor({ post, csrf, onSaved, onTrash, onRestore }: {
  post: AdminPost; csrf: string; onSaved: (id: string) => Promise<void>; onTrash: () => Promise<void>; onRestore: () => Promise<void>;
}) {
  const [title, setTitle] = useState(post.title);
  const [status, setStatus] = useState<Exclude<Status, 'trash'>>(post.status === 'published' ? 'published' : 'draft');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('https://');
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ code: false, codeBlock: false, heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, defaultProtocol: 'https' } }),
      Placeholder.configure({ placeholder: 'Начните писать обзор…' }),
    ],
    content: post.content || blankDocument(),
    editorProps: { attributes: { class: 'admin-prosemirror', 'aria-label': 'Текст публикации' } },
  });
  const isNew = post.id === 'new';
  async function save() {
    if (!editor) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api<{ id: string }>('/api/admin/posts', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ id: isNew ? undefined : post.id, source: post.source, title, content: editor.getJSON(), status: post.source === 'telegram' ? 'published' : status }),
      });
      setMessage(status === 'published' || post.source === 'telegram' ? 'Изменения опубликованы' : 'Черновик сохранён');
      await onSaved(result.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось сохранить'); }
    finally { setBusy(false); }
  }
  function addLink() {
    if (!editor) return;
    const value = linkValue.trim();
    if (!value) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}` }).run();
    setLinkOpen(false);
  }
  async function trashPost() {
    setBusy(true); setError('');
    try { await onTrash(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось переместить публикацию'); }
    finally { setBusy(false); }
  }
  async function restorePost() {
    setBusy(true); setError('');
    try { await onRestore(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось восстановить публикацию'); }
    finally { setBusy(false); }
  }
  return <section className="admin-editor-panel" aria-label={isNew ? 'Новая публикация' : `Редактирование: ${post.title}`}>
    <div className="admin-editor-heading">
      <div>
        <p className="eyebrow">{isNew ? 'Новый материал' : post.source === 'telegram' ? 'Материал из Telegram' : 'Материал сайта'}</p>
        <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">{isNew ? 'Создать обзор' : 'Редактировать обзор'}</h2>
      </div>
      {!isNew && <span className={`admin-status admin-status-${post.status}`}>{post.status === 'published' ? 'Опубликован' : post.status === 'draft' ? 'Черновик' : 'В корзине'}</span>}
    </div>
    <div className="mt-8 grid gap-2"><Label htmlFor="post-title">Заголовок</Label><Input id="post-title" value={title} maxLength={200} onChange={event => setTitle(event.target.value)} disabled={post.status === 'trash'} className="h-12 rounded-none bg-background px-4 font-serif text-lg md:text-xl" /></div>
    {post.status !== 'trash' && <>
      <div className="mt-7 grid gap-2">
        <Label>Текст публикации</Label>
        <div className="admin-editor-frame">
          <div className="admin-editor-toolbar" role="toolbar" aria-label="Форматирование текста">
            <ToolButton label="Обычный текст" active={editor?.isActive('paragraph')} onClick={() => editor?.chain().focus().setParagraph().run()}><Pilcrow /></ToolButton>
            <ToolButton label="Заголовок 2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></ToolButton>
            <ToolButton label="Заголовок 3" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 /></ToolButton>
            <span className="editor-tool-separator" />
            <ToolButton label="Жирный" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold /></ToolButton>
            <ToolButton label="Курсив" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic /></ToolButton>
            <ToolButton label="Подчёркнутый" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}><Underline /></ToolButton>
            <ToolButton label="Зачёркнутый" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough /></ToolButton>
            <span className="editor-tool-separator" />
            <ToolButton label="Маркированный список" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List /></ToolButton>
            <ToolButton label="Нумерованный список" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolButton>
            <ToolButton label="Цитата" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote /></ToolButton>
            <ToolButton label="Разделитель" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus /></ToolButton>
            <span className="editor-tool-separator" />
            <ToolButton label="Добавить ссылку" active={editor?.isActive('link')} onClick={() => { setLinkValue(editor?.getAttributes('link').href || 'https://'); setLinkOpen(value => !value); }}><Link2 /></ToolButton>
            <ToolButton label="Убрать ссылку" disabled={!editor?.isActive('link')} onClick={() => editor?.chain().focus().unsetLink().run()}><Unlink /></ToolButton>
            <span className="editor-tool-separator" />
            <ToolButton label="Отменить" disabled={!editor?.can().chain().focus().undo().run()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 /></ToolButton>
            <ToolButton label="Повторить" disabled={!editor?.can().chain().focus().redo().run()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 /></ToolButton>
          </div>
          {linkOpen && <div className="admin-link-editor">
            <Input value={linkValue} onChange={event => setLinkValue(event.target.value)} aria-label="Адрес ссылки" placeholder="https://…" className="rounded-none" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addLink(); } }} />
            <Button type="button" variant="outline" className="rounded-none" onClick={addLink}>Применить</Button>
          </div>}
          <EditorContent editor={editor} />
        </div>
      </div>
      {post.source === 'site' && <div className="mt-7 grid max-w-xs gap-2">
        <Label htmlFor="post-status">Статус после сохранения</Label>
        <select id="post-status" value={status} onChange={event => setStatus(event.target.value as 'draft' | 'published')} className="admin-select">
          <option value="draft">Черновик</option><option value="published">Опубликован</option>
        </select>
      </div>}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button type="button" onClick={() => void save()} disabled={busy || !title.trim()} className="h-10 rounded-none px-5"><Save />{busy ? 'Сохраняем…' : isNew ? 'Сохранить' : 'Сохранить изменения'}</Button>
        {!isNew && <Button type="button" variant="ghost" onClick={() => setConfirmTrash(true)} disabled={busy} className="h-10 rounded-none text-destructive"><Trash2 />В корзину</Button>}
        {message && <output className="text-sm text-muted-foreground">{message}</output>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </>}
    {post.status === 'trash' && <div className="mt-8 border-t border-border pt-6">
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">Публикация скрыта с сайта. Её можно восстановить вместе с текстом и форматированием.</p>
      <Button type="button" variant="outline" className="mt-5 h-10 rounded-none" disabled={busy} onClick={() => void restorePost()}><RotateCcw />Восстановить</Button>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </div>}
    <AlertDialog open={confirmTrash} onOpenChange={setConfirmTrash}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader><AlertDialogTitle>Переместить публикацию в корзину?</AlertDialogTitle><AlertDialogDescription>Она исчезнет с сайта, но останется доступна для восстановления.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel className="rounded-none">Отмена</AlertDialogCancel><AlertDialogAction variant="destructive" className="rounded-none" onClick={() => { setConfirmTrash(false); void trashPost(); }}>В корзину</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}

export default function AdminPage() {
  const [screen, setScreen] = useState<'loading' | 'login' | 'ready'>('loading');
  const [csrf, setCsrf] = useState('');
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [active, setActive] = useState<AdminPost | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [section, setSection] = useState<'posts' | 'settings'>('posts');
  const [settings, setSettings] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const loadPosts = useCallback(async (token: string, selectId?: string) => {
    try {
      const result = await api<{ posts: AdminPost[] }>('/api/admin/posts');
      setPosts(result.posts);
      if (selectId) setActive(result.posts.find(post => post.id === selectId) || null);
      setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось загрузить публикации'); }
  }, []);
  const loadSettings = useCallback(async () => {
    const result = await api<{ settings: unknown }>('/api/admin/settings');
    setSettings(mergeSiteContent(result.settings));
  }, []);
  useEffect(() => {
    void api<{ csrf: string }>('/api/admin/session').then(result => {
      setCsrf(result.csrf); setScreen('ready'); return Promise.all([loadPosts(result.csrf), loadSettings()]);
    }).catch(() => setScreen('login'));
  }, [loadPosts, loadSettings]);
  const visible = useMemo(() => posts.filter(post => (filter === 'all' || post.status === filter) && post.title.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'))), [filter, posts, search]);
  async function mutate(method: string, body: object, selectId?: string) {
    await api('/api/admin/posts', { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify(body) });
    await loadPosts(csrf, selectId);
  }
  if (screen === 'loading') return <main className="grid min-h-screen place-items-center bg-background"><LoaderCircle className="size-6 animate-spin text-muted-foreground" /></main>;
  if (screen === 'login') return <Login onLogin={token => { setCsrf(token); setScreen('ready'); void Promise.all([loadPosts(token), loadSettings()]); }} />;
  return <main className="admin-shell">
    <header className="admin-header">
      <div className="admin-header-inner"><div className="flex items-center gap-7"><Logo /><div className="hidden border-l border-border pl-7 sm:block"><p className="eyebrow">Панель управления</p><p className="mt-1 text-sm">Редакция</p></div></div>
        <nav className="admin-section-nav" aria-label="Разделы панели">
          <button type="button" className={section === 'posts' ? 'active' : ''} onClick={() => setSection('posts')}><Newspaper />Публикации</button>
          <button type="button" className={section === 'settings' ? 'active' : ''} onClick={() => setSection('settings')}><Settings2 />Тексты и SEO</button>
        </nav>
        <div className="flex items-center gap-2"><NextLink href="/" className="admin-site-link">Открыть сайт</NextLink><Button variant="ghost" size="icon" aria-label="Выйти" title="Выйти" onClick={async () => { try { await api('/api/admin/session', { method: 'DELETE', headers: { 'X-CSRF-Token': csrf } }); } finally { setScreen('login'); setCsrf(''); } }}><LogOut /></Button></div>
      </div>
    </header>
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        {section === 'posts' ? <>
          <div className="flex items-center justify-between"><div><p className="eyebrow">Материалы</p><h1 className="mt-3 font-serif text-3xl tracking-[-0.03em]">Публикации</h1></div><Button size="icon" className="size-10 rounded-none" aria-label="Создать публикацию" title="Создать публикацию" onClick={() => setActive({ id: 'new', title: '', content: blankDocument(), publishedAt: new Date().toISOString(), source: 'site', status: 'draft', url: null, media: [] })}><Plus /></Button></div>
          <Input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по заголовку" aria-label="Поиск по заголовку" className="mt-6 h-10 rounded-none bg-background" />
          <fieldset className="admin-filters" aria-label="Фильтр публикаций">
            {([['all', 'Все'], ['published', 'Опубликованы'], ['draft', 'Черновики'], ['trash', 'Корзина']] as [Filter, string][]).map(([value, label]) => <button type="button" key={value} onClick={() => setFilter(value)} className={filter === value ? 'active' : ''}>{label}<span>{value === 'all' ? posts.length : posts.filter(post => post.status === value).length}</span></button>)}
          </fieldset>
          {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
          <div className="admin-post-list">
            {visible.map(post => <button type="button" key={post.id} onClick={() => setActive(post)} className={active?.id === post.id ? 'active' : ''}>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{post.source === 'telegram' ? <Newspaper className="size-3" /> : <FileText className="size-3" />}{post.source === 'telegram' ? 'Telegram' : 'Сайт'} · {post.status === 'published' ? 'Опубликован' : post.status === 'draft' ? 'Черновик' : 'Корзина'}</span>
              <strong>{post.title}</strong><time dateTime={post.publishedAt}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(post.publishedAt))}</time>
            </button>)}
            {!visible.length && <p className="py-8 text-sm text-muted-foreground">В этом разделе публикаций нет.</p>}
          </div>
        </> : <>
          <p className="eyebrow">Структура страницы</p><h1 className="mt-3 font-serif text-3xl tracking-[-0.03em]">Тексты сайта</h1>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">Быстрый переход к группе полей.</p>
          <nav className="admin-settings-nav" aria-label="Группы настроек">
            {SETTINGS_GROUPS.map(group => <a key={group.id} href={`#settings-${group.id}`}>{group.title}</a>)}
          </nav>
        </>}
      </aside>
      <div className="admin-main">
        {section === 'settings' ? <SiteSettingsEditor key={JSON.stringify(settings)} settings={settings} onSave={async value => {
          const result = await api<{ settings: unknown }>('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify(value) });
          setSettings(mergeSiteContent(result.settings));
        }} onUpload={async (kind, file) => {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Не удалось прочитать файл'));
            reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
            reader.readAsDataURL(file);
          });
          const result = await api<{ url: string }>('/api/admin/assets', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ kind, dataUrl }) });
          return result.url;
        }} /> : active ? <PostEditor key={active.id} post={active} csrf={csrf} onSaved={id => loadPosts(csrf, id)} onTrash={async () => { await mutate('DELETE', { id: active.id }, active.id); }} onRestore={async () => { await mutate('PATCH', { id: active.id, action: 'restore' }, active.id); }} />
          : <section className="admin-empty"><Newspaper /><p className="eyebrow">Редакция NG / Re:port</p><h2>Выберите материал<br />или создайте новый</h2><Button className="mt-7 h-10 rounded-none" onClick={() => setActive({ id: 'new', title: '', content: blankDocument(), publishedAt: new Date().toISOString(), source: 'site', status: 'draft', url: null, media: [] })}><Plus />Новая публикация</Button></section>}
      </div>
    </div>
  </main>;
}
