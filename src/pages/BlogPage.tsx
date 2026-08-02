import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { NewsShell } from '@/components/news/NewsShell';
import { fetchArticles } from '@/data/articleStorage';
import { CATEGORIES } from '@/data/articleTypes';
import type { Article } from '@/data/articleTypes';

const ARTICLES_PER_PAGE = 5;

function ArticleCard({ article }: { article: Article }) {
  const date = new Date(article.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link to={`/news/${article.slug}`} className="article-card">
      <div className="article-card__body">
        <div className="article-card__meta">
          <div className="article-card__avatar">{article.authorInitials}</div>
          <span className="article-card__author-name">{article.authorName}</span>
          <span className="article-card__date">&middot; {date}</span>
        </div>
        <h3 className="article-card__title">{article.title}</h3>
        <p className="article-card__excerpt">{article.excerpt}</p>
        <div className="article-card__footer">
          <span className="article-card__tag">{article.category}</span>
          <span className="article-card__read-time">{article.readingTimeMinutes} min read</span>
        </div>
      </div>
      <div className="article-card__thumb" aria-hidden="true">
        {article.coverImageUrl && <img src={article.coverImageUrl} alt="" />}
      </div>
    </Link>
  );
}

export function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);

  useEffect(() => {
    let cancelled = false;
    fetchArticles().then((data) => {
      if (!cancelled) {
        setArticles(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = activeCategory
    ? articles.filter((a) => a.category === activeCategory)
    : articles;

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <NewsShell>
      <div className="blog-feed">
        <header className="blog-feed__header">
          <h1 className="blog-feed__title">Blog</h1>
          <p className="blog-feed__subtitle">
            Personal Blog where I ramble about things that are Cyber, Tech, and whatever else people
            don't want to listen to me talk about!
          </p>
        </header>

        <div className="blog-feed__filters">
          <button
            className={`blog-feed__filter${activeCategory === null ? ' blog-feed__filter--active' : ''}`}
            onClick={() => {
              setActiveCategory(null);
              setVisibleCount(ARTICLES_PER_PAGE);
            }}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`blog-feed__filter${activeCategory === cat ? ' blog-feed__filter--active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setVisibleCount(ARTICLES_PER_PAGE);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && <p className="blog-feed__empty">Loading articles...</p>}

        {!loading && filtered.length === 0 && (
          <p className="blog-feed__empty">No articles found.</p>
        )}

        <div className="blog-feed__list">
          {visible.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>

        {hasMore && (
          <div className="blog-feed__more">
            <button
              className="news-btn"
              onClick={() => setVisibleCount((c) => c + ARTICLES_PER_PAGE)}
            >
              Show more articles
            </button>
          </div>
        )}
      </div>
    </NewsShell>
  );
}
