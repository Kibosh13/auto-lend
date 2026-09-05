import { createHash } from 'node:crypto';

export const MAX_SITE_ASSET_BYTES = 4 * 1024 * 1024;
export const SITE_ASSET_KINDS = Object.freeze(['logo', 'favicon', 'social-preview']);
const MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function hasExpectedSignature(bytes, mime) {
  if (mime === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  if (mime === 'image/webp') return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export function decodeSiteAsset(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !SITE_ASSET_KINDS.includes(input.kind)) throw new Error('Некорректный тип изображения');
  if (typeof input.dataUrl !== 'string') throw new Error('Изображение не передано');
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.dataUrl);
  if (!match || !MIME_TYPES.has(match[1])) throw new Error('Поддерживаются PNG, JPG и WebP');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_SITE_ASSET_BYTES) throw new Error('Размер изображения не должен превышать 4 МБ');
  if (!hasExpectedSignature(bytes, match[1])) throw new Error('Файл не соответствует заявленному формату');
  return { kind: input.kind, mime: match[1], bytes, key: createHash('sha256').update(bytes).digest('hex') };
}
