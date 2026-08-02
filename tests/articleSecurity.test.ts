import { describe, expect, it } from 'vitest';
import {
  isSafeArticleLinkUrl,
  sanitizeArticleImageUrl,
  validateArticleImageFile,
} from '@/utils/articleSecurity';

describe('articleSecurity', () => {
  it('rejects unsafe image urls', () => {
    expect(sanitizeArticleImageUrl('data:image/svg+xml;base64,PHN2Zw==')).toBeNull();
    expect(sanitizeArticleImageUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeArticleImageUrl('https://example.com/image.png')).toBe(
      'https://example.com/image.png',
    );
  });

  it('allows only safe article link protocols', () => {
    expect(isSafeArticleLinkUrl('/news/test')).toBe(true);
    expect(isSafeArticleLinkUrl('mailto:test@example.com')).toBe(true);
    expect(isSafeArticleLinkUrl('javascript:alert(1)')).toBe(false);
  });

  it('validates article image files', () => {
    const okFile = new File(['image'], 'cover.png', { type: 'image/png' });
    const badType = new File(['svg'], 'cover.svg', { type: 'image/svg+xml' });
    const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'cover.png', {
      type: 'image/png',
    });

    expect(validateArticleImageFile(okFile)).toBeNull();
    expect(validateArticleImageFile(badType)).toBe(
      'Only JPEG, PNG, WebP, or GIF images are allowed.',
    );
    expect(validateArticleImageFile(tooLarge)).toBe('Images must be 10MB or smaller.');
  });
});
