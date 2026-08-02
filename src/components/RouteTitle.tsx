import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router';

const SITE_TITLE = 'AlphaSec United';

const ROUTE_TITLES = [
  { path: '/privacy', title: 'Privacy Policy' },
  { path: '/terms', title: 'Terms of Service' },
  { path: '/credits', title: 'Credits' },
  { path: '/map-loading', title: 'Loading Map' },
  { path: '/map', title: 'Map' },
  { path: '/settings', title: 'Settings' },
  { path: '/admin/audit', title: 'Audit Log' },
  { path: '/admin/users', title: 'User Management' },
  { path: '/admin', title: 'Admin' },
  { path: '/news/dashboard', title: 'News Dashboard' },
  { path: '/news/editor/:id', title: 'Edit Article' },
  { path: '/news/editor', title: 'New Article' },
  { path: '/news/:slug', title: 'Article' },
  { path: '/news', title: 'News' },
  { path: '/blog', title: 'Blog' },
  { path: '/services', title: 'Services' },
  { path: '/feedback', title: 'Feedback' },
] as const;

function getRouteTitle(pathname: string): string {
  const route = ROUTE_TITLES.find(({ path }) => matchPath({ path, end: true }, pathname));

  return route ? `${SITE_TITLE} | ${route.title}` : SITE_TITLE;
}

export function RouteTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getRouteTitle(pathname);
  }, [pathname]);

  return null;
}
