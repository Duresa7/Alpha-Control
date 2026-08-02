import { describe, expect, it, vi } from 'vitest';

import {
  NEWS_THEME_STORAGE_KEY,
  persistNewsTheme,
  readStoredNewsTheme,
  resolveInitialNewsTheme,
  type NewsTheme,
  type NewsThemeStorage,
} from '@/components/news/theme/newsTheme';

function createStorage(initialValue: string | null = null): NewsThemeStorage {
  let currentValue = initialValue;

  return {
    getItem: vi.fn((key: string) => (key === NEWS_THEME_STORAGE_KEY ? currentValue : null)),
    setItem: vi.fn((key: string, value: NewsTheme) => {
      if (key === NEWS_THEME_STORAGE_KEY) {
        currentValue = value;
      }
    }),
  };
}

describe('news theme helpers', () => {
  it('defaults to light when no saved value exists', () => {
    expect(resolveInitialNewsTheme(createStorage())).toBe('light');
  });

  it('restores dark when storage contains dark', () => {
    expect(resolveInitialNewsTheme(createStorage('dark'))).toBe('dark');
  });

  it('ignores invalid stored values and falls back to light', () => {
    expect(resolveInitialNewsTheme(createStorage('blue'))).toBe('light');
    expect(readStoredNewsTheme(createStorage('blue'))).toBeNull();
  });

  it('persists the selected theme', () => {
    const storage = createStorage() as NonNullable<NewsThemeStorage>;

    persistNewsTheme('dark', storage);

    expect(storage.setItem).toHaveBeenCalledWith(NEWS_THEME_STORAGE_KEY, 'dark');
    expect(resolveInitialNewsTheme(storage)).toBe('dark');
  });
});
