import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { NewsShell } from '@/components/news/NewsShell';
import { fetchArticles } from '@/data/articleStorage';
import { fetchLiveStatuses } from '@/data/liveStatuses';
import type { Article } from '@/data/articleTypes';
import type { ServiceStatus } from '@/data/liveStatuses';
import { formatDate } from '@/utils/format';

function FeaturedHero({ article }: { article: Article }) {
  return (
    <Link to={`/news/${article.slug}`} className="news-home__hero">
      <div className="news-home__hero-cover" aria-hidden="true">
        {article.coverImageUrl && <img src={article.coverImageUrl} alt="" />}
      </div>
      <p className="news-home__hero-tag">{article.category}</p>
      <h2 className="news-home__hero-title">{article.title}</h2>
      <p className="news-home__hero-excerpt">{article.excerpt}</p>
      <div className="news-home__hero-meta">
        <div className="news-home__hero-avatar">{article.authorInitials}</div>
        <span className="news-home__hero-author">{article.authorName}</span>
        <span className="news-home__hero-date">
          &middot; {formatDate(article.createdAt, 'compact')} &middot; {article.readingTimeMinutes}{' '}
          min read
        </span>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link to={`/news/${article.slug}`} className="article-card">
      <div className="article-card__body">
        <div className="article-card__meta">
          <div className="article-card__avatar">{article.authorInitials}</div>
          <span className="article-card__author-name">{article.authorName}</span>
          <span className="article-card__date">
            &middot; {formatDate(article.createdAt, 'compact')}
          </span>
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

function TrendingItem({ article, rank }: { article: Article; rank: number }) {
  return (
    <Link to={`/news/${article.slug}`} className="trending-item">
      <span className="trending-item__rank">{String(rank).padStart(2, '0')}</span>
      <div className="trending-item__body">
        <div className="trending-item__meta">
          <span className="trending-item__author">{article.authorName}</span>
          <span className="trending-item__date">
            &middot; {formatDate(article.createdAt, 'compact')}
          </span>
        </div>
        <h4 className="trending-item__title">{article.title}</h4>
      </div>
    </Link>
  );
}

function ServiceQuickCard({ status }: { status: ServiceStatus }) {
  return (
    <div className="service-quick">
      <div className={`service-quick__dot service-quick__dot--${status.status}`} />
      <span className="service-quick__name">{status.name}</span>
      {status.metric && <span className="service-quick__metric">{status.metric}</span>}
    </div>
  );
}

export function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchArticles(), fetchLiveStatuses()]).then(([articleData, statusData]) => {
      if (!cancelled) {
        setArticles(articleData);
        setStatuses(statusData);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = articles.find((a) => a.isFeatured);
  const trending = articles.filter((a) => a.isTrending && a.slug !== featured?.slug);
  const latest = articles.filter((a) => a.slug !== featured?.slug).slice(0, 6);

  return (
    <NewsShell>
      <div className="news-home">
        {loading && <p className="news-home__empty">Loading articles...</p>}

        {!loading && articles.length === 0 && (
          <p className="news-home__empty">No articles published yet.</p>
        )}

        {featured && <FeaturedHero article={featured} />}

        {latest.length > 0 && (
          <div className="news-home__grid">
            <div className="news-home__main">
              <h2 className="news-home__section-title">Latest</h2>
              {latest.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>

            <aside className="news-home__sidebar">
              {trending.length > 0 && (
                <div className="news-home__sidebar-section">
                  <h3 className="news-home__section-title">Trending</h3>
                  {trending.map((article, i) => (
                    <TrendingItem key={article.slug} article={article} rank={i + 1} />
                  ))}
                </div>
              )}

              {statuses.length > 0 && (
                <div className="news-home__sidebar-section">
                  <h3 className="news-home__section-title">AlphaSec Status</h3>
                  {statuses.map((status) => (
                    <ServiceQuickCard key={status.id} status={status} />
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </NewsShell>
  );
}
