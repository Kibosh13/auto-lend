const MAX_TEXT_LENGTH = 100_000;
const MAX_NODES = 5_000;
const MAX_DEPTH = 14;
const BLOCK_NODES = new Set(['doc', 'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote']);
const LEAF_NODES = new Set(['text', 'hardBreak', 'horizontalRule']);
const MARKS = new Set(['bold', 'italic', 'underline', 'strike', 'link']);

function safeLink(value) {
  if (typeof value !== 'string' || value.length > 2_000) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? value : null;
  } catch { return null; }
}

export function validateRichDocument(input) {
  let nodes = 0;
  let textLength = 0;
  function visit(node, depth) {
    if (!node || typeof node !== 'object' || Array.isArray(node) || depth > MAX_DEPTH || ++nodes > MAX_NODES) throw new Error('Некорректная структура текста');
    const type = node.type;
    if (!BLOCK_NODES.has(type) && !LEAF_NODES.has(type)) throw new Error('Неподдерживаемый элемент текста');
    const clean = { type };
    if (type === 'text') {
      if (typeof node.text !== 'string') throw new Error('Некорректный текст');
      textLength += node.text.length;
      if (textLength > MAX_TEXT_LENGTH) throw new Error('Текст публикации слишком длинный');
      clean.text = node.text;
      if (node.marks !== undefined) {
        if (!Array.isArray(node.marks) || node.marks.length > 8) throw new Error('Некорректное форматирование');
        clean.marks = node.marks.map(mark => {
          if (!mark || typeof mark !== 'object' || !MARKS.has(mark.type)) throw new Error('Неподдерживаемое форматирование');
          if (mark.type !== 'link') return { type: mark.type };
          const href = safeLink(mark.attrs?.href);
          if (!href) throw new Error('Некорректная ссылка');
          return { type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer nofollow' } };
        });
      }
      return clean;
    }
    if (type === 'heading') {
      const level = Number(node.attrs?.level);
      if (![2, 3].includes(level)) throw new Error('Допустимы заголовки второго и третьего уровня');
      clean.attrs = { level };
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) throw new Error('Некорректная структура текста');
      clean.content = node.content.map(child => visit(child, depth + 1));
    }
    return clean;
  }
  const document = visit(input, 0);
  if (document.type !== 'doc') throw new Error('Текст должен быть документом');
  return document;
}

export function plainTextDocument(value = '') {
  const paragraphs = String(value).split(/\n{2,}/).map(part => ({
    type: 'paragraph',
    content: part ? part.split('\n').flatMap((line, index) => [
      ...(index ? [{ type: 'hardBreak' }] : []),
      ...(line ? [{ type: 'text', text: line }] : []),
    ]) : [],
  }));
  return { type: 'doc', content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }] };
}

export function richDocumentText(document) {
  const clean = validateRichDocument(document);
  function read(node) {
    if (node.type === 'text') return node.text;
    if (node.type === 'hardBreak') return '\n';
    if (node.type === 'horizontalRule') return '\n—\n';
    const separator = ['paragraph', 'heading', 'blockquote'].includes(node.type) ? '\n\n' : node.type === 'listItem' ? '\n' : '';
    return `${(node.content || []).map(read).join('')}${separator}`;
  }
  return read(clean).replace(/\n{3,}/g, '\n\n').trim();
}

export function normalizePostInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Некорректные данные публикации');
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 200) throw new Error('Заголовок должен содержать от 1 до 200 символов');
  return { title, content: validateRichDocument(input.content) };
}
