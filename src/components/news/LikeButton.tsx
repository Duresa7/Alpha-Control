import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toggleLike } from '@/data/articleStorage';

interface LikeButtonProps {
  articleId: string;
  initialCount: number;
  initialLiked: boolean;
  onAuthRequired: () => void;
}

export function LikeButton({
  articleId,
  initialCount,
  initialLiked,
  onAuthRequired,
}: LikeButtonProps) {
  const { session } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(async () => {
    if (!session) {
      onAuthRequired();
      return;
    }
    if (busy) return;
    setBusy(true);

    const prevLiked = liked;
    const prevCount = count;

    setLiked((prev) => !prev);
    setCount((prev) => prev + (liked ? -1 : 1));

    try {
      const result = await toggleLike(articleId);
      setLiked(result.liked);
      setCount(result.count);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  }, [session, busy, liked, count, articleId, onAuthRequired]);

  return (
    <button
      className={`like-btn ${liked ? 'like-btn--active' : ''}`}
      onClick={handleClick}
      disabled={busy}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <svg
        className="like-btn__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="like-btn__count">{count}</span>
    </button>
  );
}
