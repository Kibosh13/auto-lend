/* oxlint-disable next/no-img-element -- Admin previews user-selected image URLs before saving. */
'use client';

import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SiteContent } from '@/lib/site-content';

type Field = { key: keyof SiteContent; label: string; multiline?: boolean; type?: 'text' | 'email' | 'url'; hint?: string };
type ImageField = { key: 'logoUrl' | 'faviconUrl' | 'ogImageUrl'; kind: 'logo' | 'favicon' | 'social-preview'; label: string; hint: string };
type SettingsGroup = { id: string; title: string; description: string; fields?: Field[]; imageFields?: ImageField[] };
export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'images', title: 'Изображения', description: 'Фирменные изображения сайта и карточки, которую видят при отправке ссылки.',
    imageFields: [
      { key: 'logoUrl', kind: 'logo', label: 'Логотип', hint: 'Лучше PNG с прозрачным фоном; текущая композиция — 1280 × 668 px.' },
      { key: 'faviconUrl', kind: 'favicon', label: 'Фавиконка', hint: 'Квадратное изображение, рекомендуемый размер — от 192 × 192 px.' },
      { key: 'ogImageUrl', kind: 'social-preview', label: 'Превью для соцсетей', hint: 'Рекомендуемый размер — 1200 × 630 px.' },
    ],
  },
  {
    id: 'seo', title: 'SEO и превью', description: 'Тексты для вкладки браузера, поисковой выдачи и карточки при отправке ссылки.',
    fields: [
      { key: 'seoTitle', label: 'Title страницы' },
      { key: 'seoDescription', label: 'Meta description', multiline: true },
      { key: 'seoOgTitle', label: 'Заголовок превью в соцсетях' },
      { key: 'seoOgDescription', label: 'Описание превью в соцсетях', multiline: true },
    ],
  },
  {
    id: 'hero', title: 'Первый экран', description: 'Главное сообщение, которое посетитель видит сразу после загрузки сайта.',
    fields: [
      { key: 'heroEyebrow', label: 'Надзаголовок' },
      { key: 'heroTitle', label: 'Главный заголовок', multiline: true },
      { key: 'heroDescription', label: 'Вводный текст', multiline: true },
    ],
  },
  {
    id: 'latest', title: 'Карточка свежего обзора', description: 'Подписи справа от первого экрана.',
    fields: [
      { key: 'latestNewLabel', label: 'Подпись при наличии публикаций' },
      { key: 'latestEmptyLabel', label: 'Подпись пустого состояния' },
      { key: 'latestFallbackTitle', label: 'Резервный заголовок', multiline: true },
      { key: 'latestOpenLabel', label: 'Ссылка на свежий обзор' },
      { key: 'latestArchiveLabel', label: 'Ссылка на архив' },
    ],
  },
  {
    id: 'archive', title: 'Лента обзоров', description: 'Заголовки и служебные подписи раздела с публикациями.',
    fields: [
      { key: 'archiveEyebrow', label: 'Надзаголовок' },
      { key: 'archiveTitle', label: 'Заголовок раздела' },
      { key: 'archiveDescription', label: 'Описание раздела', multiline: true },
      { key: 'archiveListLabel', label: 'Подпись над списком' },
      { key: 'archiveRefreshLabel', label: 'Кнопка обновления' },
      { key: 'articleTelegramLabel', label: 'Ссылка под публикацией' },
    ],
  },
  {
    id: 'approach', title: 'Редакционный подход', description: 'Основной текст и три этапа работы редакции.',
    fields: [
      { key: 'approachEyebrow', label: 'Надзаголовок' },
      { key: 'approachTitle', label: 'Заголовок', multiline: true },
      { key: 'approachDescription', label: 'Описание', multiline: true },
      { key: 'approachStep1Title', label: 'Этап 1 — заголовок' },
      { key: 'approachStep1Text', label: 'Этап 1 — текст', multiline: true },
      { key: 'approachStep2Title', label: 'Этап 2 — заголовок' },
      { key: 'approachStep2Text', label: 'Этап 2 — текст', multiline: true },
      { key: 'approachStep3Title', label: 'Этап 3 — заголовок' },
      { key: 'approachStep3Text', label: 'Этап 3 — текст', multiline: true },
    ],
  },
  {
    id: 'contacts', title: 'Контакты', description: 'Информация об авторе, почта и ссылка на закрытый раздел.',
    fields: [
      { key: 'contactsEyebrow', label: 'Надзаголовок' },
      { key: 'contactsBio', label: 'Описание автора', multiline: true },
      { key: 'contactsEmailLabel', label: 'Подпись перед почтой' },
      { key: 'contactsEmail', label: 'Электронная почта', type: 'email' },
      { key: 'contactsIntro', label: 'Текст перед ссылкой', multiline: true },
      { key: 'contactsLinkLabel', label: 'Текст ссылки' },
      { key: 'contactsLinkUrl', label: 'Адрес ссылки', type: 'url' },
      { key: 'contactsOutro', label: 'Текст после ссылки', multiline: true },
    ],
  },
  {
    id: 'navigation', title: 'Навигация, призыв и футер', description: 'Короткие подписи меню и завершающих блоков страницы.',
    fields: [
      { key: 'navReviews', label: 'Меню — обзоры' },
      { key: 'navApproach', label: 'Меню — подход' },
      { key: 'navContacts', label: 'Меню — контакты' },
      { key: 'ctaEyebrow', label: 'Надзаголовок призыва' },
      { key: 'ctaTitle', label: 'Заголовок призыва' },
      { key: 'ctaButton', label: 'Текст ссылки Telegram' },
      { key: 'footerLegal', label: 'Юридический текст в футере', multiline: true },
    ],
  },
];

export function SiteSettingsEditor({ settings, onSave, onUpload }: { settings: SiteContent; onSave: (value: SiteContent) => Promise<void>; onUpload: (kind: ImageField['kind'], file: File) => Promise<string> }) {
  const [values, setValues] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<ImageField['kind'] | null>(null);
  async function save() {
    setBusy(true); setMessage(''); setError('');
    try { await onSave(values); setMessage('Тексты и SEO сохранены'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось сохранить настройки'); }
    finally { setBusy(false); }
  }
  async function upload(field: ImageField, file?: File) {
    if (!file) return;
    setUploading(field.kind); setMessage(''); setError('');
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error('Размер изображения не должен превышать 4 МБ');
      const url = await onUpload(field.kind, file);
      setValues(current => ({ ...current, [field.key]: url }));
      setMessage('Изображение загружено. Нажмите «Сохранить изменения», чтобы применить его на сайте.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось загрузить изображение'); }
    finally { setUploading(null); }
  }
  return <section className="admin-settings-panel">
    <div className="admin-editor-heading">
      <div><p className="eyebrow">Содержание сайта</p><h1 className="mt-3 font-serif text-3xl tracking-[-0.03em] md:text-4xl">Тексты и SEO</h1></div>
      <span className="admin-status admin-status-published">Сайт</span>
    </div>
    <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">Изменения становятся видны после сохранения и обновления страницы. Поля публикаций редактируются отдельно в разделе «Публикации».</p>
    <form className="mt-9 grid gap-12" onSubmit={event => { event.preventDefault(); void save(); }}>
      {SETTINGS_GROUPS.map(group => <fieldset key={group.id} id={`settings-${group.id}`} className="admin-settings-group scroll-mt-6">
        <legend>{group.title}</legend><p>{group.description}</p>
        {group.imageFields && <div className="admin-image-settings-grid">
          {group.imageFields.map(field => <div key={field.key} className="admin-image-setting">
            <div className={`admin-image-preview admin-image-preview-${field.kind}`}><img src={values[field.key]} alt="" /></div>
            <div><Label>{field.label}</Label><p>{field.hint}</p>
              <label className="admin-file-button">
                <input type="file" accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploading)} onChange={event => { void upload(field, event.target.files?.[0]); event.currentTarget.value = ''; }} />
                {uploading === field.kind ? 'Загружаем…' : 'Выбрать файл'}
              </label>
            </div>
          </div>)}
        </div>}
        {group.fields && <div className="admin-settings-grid">
          {group.fields.map(field => <div key={field.key} className={field.multiline ? 'admin-setting-field admin-setting-wide' : 'admin-setting-field'}>
            <Label htmlFor={`setting-${field.key}`}>{field.label}</Label>
            {field.multiline ? <Textarea id={`setting-${field.key}`} value={values[field.key]} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} className="min-h-28 rounded-none bg-background p-3 leading-6" />
              : <Input id={`setting-${field.key}`} type={field.type || 'text'} value={values[field.key]} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} className="h-11 rounded-none bg-background px-3" />}
            {field.hint && <small>{field.hint}</small>}
          </div>)}
        </div>}
      </fieldset>)}
      <div className="admin-settings-actions">
        <Button type="submit" disabled={busy || Boolean(uploading)} className="h-10 rounded-none px-5"><Save />{busy ? 'Сохраняем…' : 'Сохранить изменения'}</Button>
        <Button type="button" variant="ghost" disabled={busy || Boolean(uploading)} onClick={() => { setValues(settings); setMessage(''); setError(''); }} className="h-10 rounded-none"><RotateCcw />Вернуть сохранённые</Button>
        {message && <output className="text-sm text-muted-foreground">{message}</output>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  </section>;
}
