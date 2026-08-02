import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArticleInput } from '@/data/articleTypes';

const mocks = vi.hoisted(() => {
  const state = {
    currentUser: { id: 'user-1' } as { id: string } | null,
    articleById: new Map<string, Record<string, unknown>>(),
    profileById: new Map<string, { display_name: string }>(),
    createdArticleId: 'article-1',
    articleInsertPayload: null as Record<string, unknown> | null,
    articleUpdatePayload: null as Record<string, unknown> | null,
    articleDeleteId: null as string | null,
    existingLike: false,
    likeInsertPayload: null as Record<string, unknown> | null,
    likeDeleteFilters: [] as Array<[string, string]>,
    likesCountByArticle: new Map<string, number>(),
    commentInsertPayload: null as Record<string, unknown> | null,
    insertedComment: {
      id: 'comment-1',
      body: 'Trimmed comment',
      created_at: '2026-03-26T15:00:00.000Z',
    },
    commentDeleteId: null as string | null,
    uploadPath: null as string | null,
    uploadError: null as { message: string } | null,
    publicUrl: 'https://cdn.example.com/article-image.png',
  };

  const storageFrom = vi.fn(() => ({
    upload: vi.fn(async (path: string) => {
      state.uploadPath = path;
      return { error: state.uploadError };
    }),
    getPublicUrl: vi.fn(() => ({
      data: { publicUrl: state.publicUrl },
    })),
  }));

  const from = vi.fn((table: string) => {
    if (table === 'articles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: string) => ({
            single: vi.fn(async () => ({
              data: field === 'id' ? (state.articleById.get(value) ?? null) : null,
              error: null,
            })),
          })),
        })),
        insert: vi.fn((payload: Record<string, unknown>) => {
          state.articleInsertPayload = payload;
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { id: state.createdArticleId },
                error: null,
              })),
            })),
          };
        }),
        update: vi.fn((payload: Record<string, unknown>) => {
          state.articleUpdatePayload = payload;
          return {
            eq: vi.fn(async (_field: string, value: string) => {
              state.articleDeleteId = value;
              return { error: null };
            }),
          };
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_field: string, value: string) => {
            state.articleDeleteId = value;
            return { error: null };
          }),
        })),
      };
    }

    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_field: string, value: string) => ({
            single: vi.fn(async () => ({
              data: state.profileById.get(value) ?? null,
              error: null,
            })),
          })),
        })),
      };
    }

    if (table === 'article_likes') {
      return {
        select: vi.fn((_columns?: string, options?: { count?: 'exact'; head?: boolean }) => {
          if (options?.count === 'exact' && options.head) {
            return {
              eq: vi.fn(async (_field: string, value: string) => ({
                count: state.likesCountByArticle.get(value) ?? 0,
                error: null,
              })),
            };
          }

          const filters = new Map<string, string>();
          const chain = {
            eq: vi.fn((field: string, value: string) => {
              filters.set(field, value);
              return chain;
            }),
            maybeSingle: vi.fn(async () => ({
              data:
                state.existingLike && filters.get('article_id') && filters.get('user_id')
                  ? { article_id: filters.get('article_id') }
                  : null,
              error: null,
            })),
          };

          return chain;
        }),
        insert: vi.fn(async (payload: Record<string, unknown>) => {
          state.likeInsertPayload = payload;
          return { error: null };
        }),
        delete: vi.fn(() => {
          const chain = {
            eq: vi.fn((field: string, value: string) => {
              state.likeDeleteFilters.push([field, value]);
              return chain;
            }),
          };

          return chain;
        }),
      };
    }

    if (table === 'article_comments') {
      return {
        insert: vi.fn((payload: Record<string, unknown>) => {
          state.commentInsertPayload = payload;
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: state.insertedComment,
                error: null,
              })),
            })),
          };
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(async (_field: string, value: string) => {
            state.commentDeleteId = value;
            return { error: null };
          }),
        })),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    state,
    from,
    storageFrom,
    authGetUser: vi.fn(async () => ({
      data: { user: state.currentUser },
    })),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    from: mocks.from,
    storage: {
      from: mocks.storageFrom,
    },
    auth: {
      getUser: mocks.authGetUser,
    },
  },
}));

import {
  addComment,
  createArticle,
  deleteComment,
  fetchArticleById,
  toggleLike,
  updateArticle,
  uploadArticleImage,
} from '@/data/articleStorage';

const articleInput: ArticleInput = {
  title: 'Secure Post',
  slug: 'secure-post',
  excerpt: 'Short summary',
  content: '<script>alert(1)</script><p>Safe body</p>',
  category: 'Cybersecurity',
  coverImageUrl: 'javascript:alert(1)',
  readingTimeMinutes: 5,
  isFeatured: false,
  isTrending: true,
  published: true,
};

describe('articleStorage', () => {
  beforeEach(() => {
    mocks.state.currentUser = { id: 'user-1' };
    mocks.state.articleById.clear();
    mocks.state.profileById.clear();
    mocks.state.createdArticleId = 'article-1';
    mocks.state.articleInsertPayload = null;
    mocks.state.articleUpdatePayload = null;
    mocks.state.articleDeleteId = null;
    mocks.state.existingLike = false;
    mocks.state.likeInsertPayload = null;
    mocks.state.likeDeleteFilters = [];
    mocks.state.likesCountByArticle.clear();
    mocks.state.commentInsertPayload = null;
    mocks.state.insertedComment = {
      id: 'comment-1',
      body: 'Trimmed comment',
      created_at: '2026-03-26T15:00:00.000Z',
    };
    mocks.state.commentDeleteId = null;
    mocks.state.uploadPath = null;
    mocks.state.uploadError = null;
    mocks.state.publicUrl = 'https://cdn.example.com/article-image.png';

    mocks.from.mockClear();
    mocks.storageFrom.mockClear();
    mocks.authGetUser.mockClear();
  });

  it('sanitizes article content and cover images when reading by id', async () => {
    mocks.state.articleById.set('article-1', {
      id: 'article-1',
      slug: 'secure-post',
      title: 'Secure Post',
      excerpt: 'Short summary',
      content: '<script>alert(1)</script><p>Safe body</p>',
      category: 'Cybersecurity',
      cover_image_url: 'javascript:alert(1)',
      author_id: 'author-1',
      reading_time_minutes: 5,
      is_featured: false,
      is_trending: true,
      published: true,
      created_at: '2026-03-26T14:00:00.000Z',
      updated_at: '2026-03-26T14:05:00.000Z',
    });
    mocks.state.profileById.set('author-1', { display_name: 'Luke Skywalker' });

    const article = await fetchArticleById('article-1');

    expect(article?.content).toBe('<p>Safe body</p>');
    expect(article?.coverImageUrl).toBeUndefined();
    expect(article?.authorInitials).toBe('LS');
  });

  it('sanitizes article content and image urls before create', async () => {
    const articleId = await createArticle(articleInput, 'author-1');

    expect(articleId).toBe('article-1');
    expect(mocks.state.articleInsertPayload).toMatchObject({
      title: 'Secure Post',
      content: '<p>Safe body</p>',
      cover_image_url: null,
      author_id: 'author-1',
    });
  });

  it('sanitizes updates and stamps updated_at', async () => {
    await updateArticle('article-1', {
      content: '<p>Updated</p><iframe src="https://bad.example" />',
      coverImageUrl: '/images/safe.png',
    });

    expect(mocks.state.articleUpdatePayload?.content).toBe('<p>Updated</p>');
    expect(mocks.state.articleUpdatePayload?.cover_image_url).toBe('/images/safe.png');
    expect(typeof mocks.state.articleUpdatePayload?.updated_at).toBe('string');
  });

  it('inserts a like for authenticated users and returns the new count', async () => {
    mocks.state.likesCountByArticle.set('article-1', 6);

    await expect(toggleLike('article-1')).resolves.toEqual({ liked: true, count: 6 });
    expect(mocks.state.likeInsertPayload).toEqual({
      article_id: 'article-1',
      user_id: 'user-1',
    });
  });

  it('rejects like toggles when the user is not authenticated', async () => {
    mocks.state.currentUser = null;

    await expect(toggleLike('article-1')).rejects.toThrow('Not authenticated');
  });

  it('trims comment bodies and marks the inserted comment as deletable by the author', async () => {
    mocks.state.profileById.set('user-1', { display_name: 'Han Solo' });

    await expect(addComment('article-1', '  Trimmed comment  ')).resolves.toEqual({
      id: 'comment-1',
      authorName: 'Han Solo',
      body: 'Trimmed comment',
      createdAt: '2026-03-26T15:00:00.000Z',
      canDelete: true,
    });
    expect(mocks.state.commentInsertPayload).toEqual({
      article_id: 'article-1',
      user_id: 'user-1',
      body: 'Trimmed comment',
    });
  });

  it('rejects blank comments before writing to storage', async () => {
    await expect(addComment('article-1', '   ')).rejects.toThrow('Comment body is required');
    expect(mocks.state.commentInsertPayload).toBeNull();
  });

  it('deletes comments by id', async () => {
    await deleteComment('comment-9');

    expect(mocks.state.commentDeleteId).toBe('comment-9');
  });

  it('uploads valid article images and returns the public url', async () => {
    const file = new File(['image'], 'cover.png', { type: 'image/png' });

    await expect(uploadArticleImage(file)).resolves.toBe(
      'https://cdn.example.com/article-image.png',
    );
    expect(mocks.state.uploadPath).toMatch(/\.png$/);
  });

  it('rejects invalid article images before upload', async () => {
    const file = new File(['svg'], 'cover.svg', { type: 'image/svg+xml' });

    await expect(uploadArticleImage(file)).rejects.toThrow(
      'Only JPEG, PNG, WebP, or GIF images are allowed.',
    );
    expect(mocks.state.uploadPath).toBeNull();
  });

  it('surfaces upload failures from storage', async () => {
    const file = new File(['image'], 'cover.png', { type: 'image/png' });
    mocks.state.uploadError = { message: 'upload failed' };

    await expect(uploadArticleImage(file)).rejects.toMatchObject({ message: 'upload failed' });
  });
});
