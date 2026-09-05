import { Fragment, type ReactNode } from 'react';

export type RichMark = { type: 'bold' | 'italic' | 'underline' | 'strike' | 'link'; attrs?: { href?: string } };
export type RichNode = { type: string; text?: string; attrs?: { level?: number }; marks?: RichMark[]; content?: RichNode[] };
export type RichDocument = { type: 'doc'; content?: RichNode[] };

function safeHref(value?: string) {
  if (!value) return null;
  try { return ['http:', 'https:', 'mailto:'].includes(new URL(value).protocol) ? value : null; }
  catch { return null; }
}

function markedText(node: RichNode, key: string): ReactNode {
  let output: ReactNode = node.text || '';
  for (const [index, mark] of (node.marks || []).entries()) {
    const markKey = `${key}-m${index}`;
    if (mark.type === 'bold') output = <strong key={markKey}>{output}</strong>;
    if (mark.type === 'italic') output = <em key={markKey}>{output}</em>;
    if (mark.type === 'underline') output = <u key={markKey}>{output}</u>;
    if (mark.type === 'strike') output = <s key={markKey}>{output}</s>;
    if (mark.type === 'link') {
      const href = safeHref(mark.attrs?.href);
      if (href) output = <a key={markKey} href={href} target="_blank" rel="noopener noreferrer nofollow">{output}</a>;
    }
  }
  return output;
}

function renderNode(node: RichNode, key: string): ReactNode {
  if (node.type === 'text') return <Fragment key={key}>{markedText(node, key)}</Fragment>;
  if (node.type === 'hardBreak') return <br key={key} />;
  if (node.type === 'horizontalRule') return <hr key={key} />;
  const children = (node.content || []).map((child, index) => renderNode(child, `${key}-${index}`));
  if (node.type === 'paragraph') return <p key={key}>{children}</p>;
  if (node.type === 'heading' && node.attrs?.level === 2) return <h4 key={key}>{children}</h4>;
  if (node.type === 'heading') return <h5 key={key}>{children}</h5>;
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>;
  if (node.type === 'orderedList') return <ol key={key}>{children}</ol>;
  if (node.type === 'listItem') return <li key={key}>{children}</li>;
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>;
  return <Fragment key={key}>{children}</Fragment>;
}

export function RichText({ document }: { document: RichDocument }) {
  return <div className="article-rich-text">{(document.content || []).map((node, index) => renderNode(node, String(index)))}</div>;
}
