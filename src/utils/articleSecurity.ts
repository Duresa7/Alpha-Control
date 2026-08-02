const ARTICLE_ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strong',
  'u',
  'ul',
]);

const ARTICLE_DROP_TAGS = new Set([
  'button',
  'embed',
  'form',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'textarea',
]);

const ARTICLE_ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ['image/gif', 'gif'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export const ARTICLE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getUrlBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'https://example.invalid';
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value, getUrlBase());
  } catch {
    return null;
  }
}

function isRelativeUrl(value: string): boolean {
  return (
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('#')
  );
}

export function isSafeArticleLinkUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isRelativeUrl(trimmed)) return true;

  const url = parseUrl(trimmed);
  if (!url) return false;

  return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol.toLowerCase());
}

export function sanitizeArticleImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isRelativeUrl(trimmed) && !trimmed.startsWith('#')) return trimmed;

  const url = parseUrl(trimmed);
  if (!url) return null;

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return null;
  }

  return url.toString();
}

function unwrapElement(element: Element) {
  const parent = element.parentNode;
  if (!parent) return;

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
}

function sanitizeAttributes(element: Element) {
  const tag = element.tagName.toLowerCase();

  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;

    if (name.startsWith('on') || name === 'style' || name === 'srcset') {
      element.removeAttribute(attribute.name);
      continue;
    }

    if (tag === 'a') {
      if (name === 'href') {
        if (!isSafeArticleLinkUrl(value)) {
          element.removeAttribute(attribute.name);
        }
        continue;
      }

      if (name !== 'title') {
        element.removeAttribute(attribute.name);
      }
      continue;
    }

    if (tag === 'img') {
      if (name === 'src') {
        const safeSrc = sanitizeArticleImageUrl(value);
        if (safeSrc) {
          element.setAttribute('src', safeSrc);
        } else {
          element.removeAttribute(attribute.name);
        }
        continue;
      }

      if (name !== 'alt' && name !== 'title') {
        element.removeAttribute(attribute.name);
      }
      continue;
    }

    element.removeAttribute(attribute.name);
  }

  if (tag === 'a') {
    const href = element.getAttribute('href');
    if (!href) {
      unwrapElement(element);
      return;
    }

    element.setAttribute('rel', 'noopener noreferrer');
  }

  if (tag === 'img' && !element.getAttribute('src')) {
    element.remove();
  }
}

function sanitizeNode(node: Node) {
  if (node.nodeType === 8) {
    node.parentNode?.removeChild(node);
    return;
  }

  if (node.nodeType !== 1) {
    if (node.nodeType !== 3) {
      node.parentNode?.removeChild(node);
    }
    return;
  }

  const element = node as Element;

  for (const child of [...element.childNodes]) {
    sanitizeNode(child);
  }

  const tag = element.tagName.toLowerCase();
  if (!ARTICLE_ALLOWED_TAGS.has(tag)) {
    if (ARTICLE_DROP_TAGS.has(tag)) {
      element.remove();
      return;
    }

    unwrapElement(element);
    return;
  }

  sanitizeAttributes(element);
}

export function sanitizeArticleHtml(html: string): string {
  if (!html.trim()) return '';
  if (typeof DOMParser === 'undefined') {
    return escapeHtml(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  for (const child of [...doc.body.childNodes]) {
    sanitizeNode(child);
  }

  return doc.body.innerHTML;
}

export function validateArticleImageFile(file: File): string | null {
  if (!ARTICLE_ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Only JPEG, PNG, WebP, or GIF images are allowed.';
  }

  if (file.size > ARTICLE_IMAGE_MAX_BYTES) {
    return 'Images must be 10MB or smaller.';
  }

  return null;
}

export function getArticleImageExtension(file: File): string {
  return ARTICLE_ALLOWED_IMAGE_TYPES.get(file.type) ?? 'jpg';
}
