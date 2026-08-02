import type { Dispatch, ReactNode, SetStateAction } from 'react';

import type { NewsTheme } from '@/components/news/theme/newsTheme';

const THEME_OPTIONS: Array<{
  value: NewsTheme;
  label: string;
  icon: ReactNode;
}> = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
];

interface ThemeSettingsSectionProps {
  theme: NewsTheme;
  setTheme: Dispatch<SetStateAction<NewsTheme>>;
}

export function ThemeSettingsSection({ theme, setTheme }: ThemeSettingsSectionProps) {
  return (
    <section id="settings-panel-theme" className="settings-page__group" role="tabpanel">
      <div className="settings-page__group-header">
        <h2 className="settings-page__group-title">Theme</h2>
      </div>

      <div className="settings-page__theme-row">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="settings-page__theme-option"
            onClick={() => setTheme(option.value)}
            aria-pressed={theme === option.value}
          >
            <span className="settings-page__theme-icon" aria-hidden="true">
              {option.icon}
            </span>
            <span className="settings-page__theme-option-title">{option.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
