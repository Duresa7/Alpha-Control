import { supabase, supabaseConfigured } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { Article, ArticleComment, ArticleInput } from '@/data/articleTypes';
import {
  getArticleImageExtension,
  sanitizeArticleHtml,
  sanitizeArticleImageUrl,
  validateArticleImageFile,
} from '@/utils/articleSecurity';
import { getInitials } from '@/utils/format';

interface DbArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image_url: string | null;
  author_id: string;
  reading_time_minutes: number;
  is_featured: boolean;
  is_trending: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface DbComment {
  id: string;
  article_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

function dbToArticle(
  row: DbArticle,
  authorName: string,
  authorInitials: string,
  likesCount: number,
  userHasLiked: boolean,
): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: sanitizeArticleHtml(row.content),
    category: row.category as Article['category'],
    coverImageUrl: sanitizeArticleImageUrl(row.cover_image_url) ?? undefined,
    authorName,
    authorInitials,
    readingTimeMinutes: row.reading_time_minutes,
    isFeatured: row.is_featured,
    isTrending: row.is_trending,
    published: row.published,
    likesCount,
    userHasLiked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchArticles(opts?: {
  category?: string;
  limit?: number;
  offset?: number;
  includeDrafts?: boolean;
}): Promise<Article[]> {
  if (!supabaseConfigured) return [];

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!opts?.includeDrafts) {
    query = query.eq('published', true);
  }
  if (opts?.category) {
    query = query.eq('category', opts.category);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('Failed to fetch articles:', error);
    return [];
  }

  const articles = data as DbArticle[];
  if (articles.length === 0) return [];

  const authorIds = [...new Set(articles.map((a) => a.author_id))];
  const articleIds = articles.map((a) => a.id);

  const [profilesRes, userLikesRes] = await Promise.all([
    supabase.from('profiles').select('id, display_name').in('id', authorIds),
    getCurrentUserLikes(articleIds),
  ]);

  const profileMap = new Map<string, string>();
  if (profilesRes.data) {
    for (const p of profilesRes.data) {
      profileMap.set(p.id, p.display_name || 'Anonymous');
    }
  }

  const likesCountMap = new Map<string, number>();
  const likesCountQueries = await Promise.all(
    articleIds.map((aid) =>
      supabase
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', aid)
        .then(({ count }) => ({ id: aid, count: count ?? 0 })),
    ),
  );
  for (const { id: aid, count: c } of likesCountQueries) {
    likesCountMap.set(aid, c);
  }

  return articles.map((row) => {
    const name = profileMap.get(row.author_id) || 'Anonymous';
    return dbToArticle(
      row,
      name,
      getInitials(name),
      likesCountMap.get(row.id) ?? 0,
      userLikesRes.has(row.id),
    );
  });
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch article by slug:', error);
    }
    return null;
  }

  const row = data as DbArticle;

  const [profileRes, likesCountRes, userLikesRes] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', row.author_id).single(),
    supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', row.id),
    getCurrentUserLikes([row.id]),
  ]);

  const name = profileRes.data?.display_name || 'Anonymous';
  const likesCount = likesCountRes.count ?? 0;

  return dbToArticle(row, name, getInitials(name), likesCount, userLikesRes.has(row.id));
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();

  if (error || !data) return null;

  const row = data as DbArticle;
  const profileRes = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', row.author_id)
    .single();

  const name = profileRes.data?.display_name || 'Anonymous';
  return dbToArticle(row, name, getInitials(name), 0, false);
}

export async function createArticle(input: ArticleInput, authorId: string): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const sanitizedContent = sanitizeArticleHtml(input.content);
  const sanitizedCoverImageUrl = sanitizeArticleImageUrl(input.coverImageUrl);

  const { data, error } = await supabase
    .from('articles')
    .insert({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: sanitizedContent,
      category: input.category,
      cover_image_url: sanitizedCoverImageUrl,
      reading_time_minutes: input.readingTimeMinutes,
      is_featured: input.isFeatured,
      is_trending: input.isTrending,
      published: input.published,
      author_id: authorId,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to create article:', error);
    throw error;
  }

  return data?.id ?? null;
}

export async function updateArticle(id: string, input: Partial<ArticleInput>): Promise<void> {
  if (!supabaseConfigured) return;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.excerpt !== undefined) updates.excerpt = input.excerpt;
  if (input.content !== undefined) updates.content = sanitizeArticleHtml(input.content);
  if (input.category !== undefined) updates.category = input.category;
  if (input.readingTimeMinutes !== undefined)
    updates.reading_time_minutes = input.readingTimeMinutes;
  if (input.isFeatured !== undefined) updates.is_featured = input.isFeatured;
  if (input.isTrending !== undefined) updates.is_trending = input.isTrending;
  if (input.published !== undefined) updates.published = input.published;
  if (input.coverImageUrl !== undefined) {
    updates.cover_image_url = sanitizeArticleImageUrl(input.coverImageUrl);
  }

  const { error } = await supabase.from('articles').update(updates).eq('id', id);
  if (error) {
    logger.error('Failed to update article:', error);
    throw error;
  }
}

export async function deleteArticle(id: string): Promise<void> {
  if (!supabaseConfigured) return;

  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) {
    logger.error('Failed to delete article:', error);
    throw error;
  }
}

async function getCurrentUserLikes(articleIds: string[]): Promise<Set<string>> {
  if (!supabaseConfigured || articleIds.length === 0) return new Set();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return new Set();

  const { data, error } = await supabase
    .from('article_likes')
    .select('article_id')
    .eq('user_id', userData.user.id)
    .in('article_id', articleIds);

  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.article_id));
}

export async function toggleLike(articleId: string): Promise<{ liked: boolean; count: number }> {
  if (!supabaseConfigured) throw new Error('Supabase not configured');

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const userId = userData.user.id;

  const { data: existing } = await supabase
    .from('article_likes')
    .select('article_id')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('article_likes').delete().eq('article_id', articleId).eq('user_id', userId);
  } else {
    await supabase.from('article_likes').insert({ article_id: articleId, user_id: userId });
  }

  const { count } = await supabase
    .from('article_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId);

  return { liked: !existing, count: count ?? 0 };
}

export async function fetchComments(articleId: string): Promise<ArticleComment[]> {
  if (!supabaseConfigured) return [];

  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData.user?.id ?? null;

  const { data, error } = await supabase
    .from('article_comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch comments:', error);
    return [];
  }

  const comments = data as DbComment[];
  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const nameMap = new Map<string, string>();
  if (profiles) {
    for (const p of profiles) {
      nameMap.set(p.id, p.display_name || 'Anonymous');
    }
  }

  return comments.map((c) => ({
    id: c.id,
    authorName: nameMap.get(c.user_id) || 'Anonymous',
    body: c.body,
    createdAt: c.created_at,
    canDelete: currentUserId === c.user_id,
  }));
}

export async function addComment(articleId: string, body: string): Promise<ArticleComment> {
  if (!supabaseConfigured) throw new Error('Supabase not configured');

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');
  const normalizedBody = body.trim();
  if (!normalizedBody) throw new Error('Comment body is required');

  const { data, error } = await supabase
    .from('article_comments')
    .insert({
      article_id: articleId,
      user_id: userData.user.id,
      body: normalizedBody,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to add comment:', error);
    throw error;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userData.user.id)
    .single();

  return {
    id: data.id,
    authorName: profile?.display_name || 'Anonymous',
    body: data.body,
    createdAt: data.created_at,
    canDelete: true,
  };
}

export async function deleteComment(commentId: string): Promise<void> {
  if (!supabaseConfigured) return;

  const { error } = await supabase.from('article_comments').delete().eq('id', commentId);

  if (error) {
    logger.error('Failed to delete comment:', error);
    throw error;
  }
}

export async function uploadArticleImage(file: File): Promise<string> {
  if (!supabaseConfigured) throw new Error('Supabase not configured');
  const validationError = validateArticleImageFile(file);
  if (validationError) throw new Error(validationError);

  const ext = getArticleImageExtension(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(path, file, { contentType: file.type });

  if (error) {
    logger.error('Failed to upload image:', error);
    throw error;
  }

  const { data } = supabase.storage.from('article-images').getPublicUrl(path);
  return data.publicUrl;
}
