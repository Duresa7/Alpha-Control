import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

export type NewsTheme = 'light' | 'dark';
export type NewsThemeStorage = Pick<Storage, 'getItem' | 'setItem'> | null | undefined;

export interface NewsThemeContextValue {
  theme: NewsTheme;
  setTheme: Dispatch<SetStateAction<NewsTheme>>;
}

export const NEWS_THEME_STORAGE_KEY = 'news-theme';

export const NewsThemeContext = createContext<NewsThemeContextValue | null>(null);

function isNewsTheme(value: string | null): value is NewsTheme {
  return value === 'light' || value === 'dark';
}

function getDefaultStorage(): NewsThemeStorage {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function readStoredNewsTheme(
  storage: NewsThemeStorage = getDefaultStorage(),
): NewsTheme | null {
  if (!storage) {
    return null;
  }

  try {
    const value = storage.getItem(NEWS_THEME_STORAGE_KEY);
    return isNewsTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function resolveInitialNewsTheme(
  storage: NewsThemeStorage = getDefaultStorage(),
): NewsTheme {
  return readStoredNewsTheme(storage) ?? 'light';
}

export function persistNewsTheme(
  theme: NewsTheme,
  storage: NewsThemeStorage = getDefaultStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(NEWS_THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage write failures and keep the in-memory preference.
  }
}

export function useNewsTheme() {
  const [theme, setTheme] = useState<NewsTheme>(() => resolveInitialNewsTheme());

  useEffect(() => {
    persistNewsTheme(theme);
  }, [theme]);

  return {
    theme,
    setTheme,
  };
}

export function useNewsThemeContext() {
  const value = useContext(NewsThemeContext);

  if (!value) {
    throw new Error('useNewsThemeContext must be used within NewsShell.');
  }

  return value;
}
