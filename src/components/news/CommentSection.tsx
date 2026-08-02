import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { fetchComments, addComment, deleteComment } from '@/data/articleStorage';
import type { ArticleComment } from '@/data/articleTypes';
import { formatDate, getInitials } from '@/utils/format';

interface CommentSectionProps {
  articleId: string;
  onAuthRequired: () => void;
}

export function CommentSection({ articleId, onAuthRequired }: CommentSectionProps) {
  const { session } = useAuth();
  const { isBossman } = useRole();
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchComments(articleId).then((data) => {
      if (!cancelled) {
        setComments(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [articleId, session?.user?.id]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!session) {
        onAuthRequired();
        return;
      }
      const trimmed = body.trim();
      if (!trimmed || submitting) return;

      setSubmitting(true);
      try {
        const comment = await addComment(articleId, trimmed);
        setComments((prev) => [...prev, comment]);
        setBody('');
      } catch {
        // optimistic UI — no rollback needed
      } finally {
        setSubmitting(false);
      }
    },
    [session, body, submitting, articleId, onAuthRequired],
  );

  const handleDelete = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // server-side only — comment stays if delete fails
    }
  }, []);

  return (
    <section className="comment-section">
      <h3 className="comment-section__title">Responses ({comments.length})</h3>

      <form className="comment-section__form" onSubmit={handleSubmit}>
        <textarea
          className="comment-section__input"
          placeholder={session ? 'What are your thoughts?' : 'Sign in to leave a response'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => {
            if (!session) onAuthRequired();
          }}
          rows={3}
          maxLength={2000}
          disabled={!session}
        />
        {session && (
          <button
            type="submit"
            className="comment-section__submit"
            disabled={submitting || !body.trim()}
          >
            {submitting ? 'Posting...' : 'Respond'}
          </button>
        )}
      </form>

      <div className="comment-section__list">
        {loading && <p className="comment-section__empty">Loading responses...</p>}
        {!loading && comments.length === 0 && (
          <p className="comment-section__empty">
            No responses yet. Be the first to share your thoughts.
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-item__header">
              <div className="comment-item__avatar">{getInitials(c.authorName)}</div>
              <div className="comment-item__meta">
                <span className="comment-item__author">{c.authorName}</span>
                <span className="comment-item__date">{formatDate(c.createdAt)}</span>
              </div>
              {(c.canDelete || isBossman) && (
                <button
                  className="comment-item__delete"
                  onClick={() => handleDelete(c.id)}
                  aria-label="Delete comment"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <p className="comment-item__body">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
