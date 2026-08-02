export type Category = 'Cybersecurity' | 'Tech' | 'Life' | 'Nonsense';

export const CATEGORIES: Category[] = ['Cybersecurity', 'Tech', 'Life', 'Nonsense'];

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  coverImageUrl?: string;
  authorName: string;
  authorInitials: string;
  readingTimeMinutes: number;
  isFeatured: boolean;
  isTrending: boolean;
  published: boolean;
  likesCount: number;
  userHasLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  canDelete: boolean;
}

export interface ArticleInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: Category;
  coverImageUrl?: string | null;
  readingTimeMinutes: number;
  isFeatured: boolean;
  isTrending: boolean;
  published: boolean;
}
