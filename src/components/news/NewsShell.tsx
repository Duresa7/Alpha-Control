import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

import '@/styles/news.css';

import { NewsFooter } from '@/components/news/NewsFooter';
import { NotificationBell } from '@/components/NotificationBell';
import { NewsProfileMenu } from '@/components/news/NewsProfileMenu';
import { NewsThemeContext, useNewsTheme } from '@/components/news/theme/newsTheme';
import { useRole } from '@/hooks/useRole';

const NAV_ITEMS = [
  { path: '/news', label: 'Home' },
  { path: '/blog', label: 'Blog' },
  { path: '/services', label: 'AlphaSec Services' },
];

export function NewsShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isBossman } = useRole();
  const themeState = useNewsTheme();
  const { theme } = themeState;

  return (
    <NewsThemeContext.Provider value={themeState}>
      <main className="news-page" data-news-theme={theme} aria-label="AlphaSec News">
        <div className="news-page__layer news-page__layer--base" aria-hidden="true" />
        <div className="news-page__layer news-page__layer--veil" aria-hidden="true" />

        <div className="news-page__shell">
          <header className="news-nav" role="banner">
            <div className="news-nav__inner">
              <Link to="/" className="news-nav__icon-btn" aria-label="Back to home">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 12H5" />
                  <path d="m12 5-7 7 7 7" />
                </svg>
              </Link>

              <Link to="/news" className="news-nav__logo">
                ALPHASEC UNITED
              </Link>

              <nav className="news-nav__links" aria-label="Main navigation">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.path === '/news'
                      ? pathname === '/news' ||
                        (pathname.startsWith('/news/') && !pathname.startsWith('/news/dashboard'))
                      : pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`news-nav__link${isActive ? ' news-nav__link--active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {isBossman && (
                  <Link
                    to="/news/dashboard"
                    className={`news-nav__link${pathname === '/news/dashboard' ? ' news-nav__link--active' : ''}`}
                  >
                    Dashboard
                  </Link>
                )}
              </nav>

              <div className="news-nav__actions">
                <button className="news-nav__icon-btn" aria-label="Search" type="button">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
                <NotificationBell variant="news" />
                <NewsProfileMenu />
              </div>
            </div>
          </header>

          <div className="news-page__content">{children}</div>

          <NewsFooter />
        </div>
      </main>
    </NewsThemeContext.Provider>
  );
}
