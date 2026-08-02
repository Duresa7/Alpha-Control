import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RouteTitle } from '@/components/RouteTitle';

describe('route titles', () => {
  it.each([
    ['/', 'AlphaSec United'],
    ['/privacy', 'AlphaSec United | Privacy Policy'],
    ['/terms', 'AlphaSec United | Terms of Service'],
    ['/credits', 'AlphaSec United | Credits'],
    ['/map-loading', 'AlphaSec United | Loading Map'],
    ['/map', 'AlphaSec United | Map'],
    ['/settings', 'AlphaSec United | Settings'],
    ['/admin', 'AlphaSec United | Admin'],
    ['/admin/audit', 'AlphaSec United | Audit Log'],
    ['/admin/users', 'AlphaSec United | User Management'],
    ['/news', 'AlphaSec United | News'],
    ['/news/dashboard', 'AlphaSec United | News Dashboard'],
    ['/news/editor', 'AlphaSec United | New Article'],
    ['/news/editor/article-id', 'AlphaSec United | Edit Article'],
    ['/news/article-slug', 'AlphaSec United | Article'],
    ['/blog', 'AlphaSec United | Blog'],
    ['/services', 'AlphaSec United | Services'],
    ['/feedback', 'AlphaSec United | Feedback'],
  ])('sets the title for %s', async (pathname, expectedTitle) => {
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <RouteTitle />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe(expectedTitle);
    });
  });
});
