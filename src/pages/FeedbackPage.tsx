import { useState, type FormEvent } from 'react';
import { NewsShell } from '@/components/news/NewsShell';
import { NewsAuthModal } from '@/components/news/NewsAuthModal';
import { insertFeedback, type FeedbackCategory } from '@/data/feedbackStorage';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug', label: 'Bug' },
  { value: 'other', label: 'Other' },
];

function getCategoryLabel(value: FeedbackCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function FeedbackPage() {
  const { session } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory>('feature_request');
  const [otherLabel, setOtherLabel] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError('Please sign in to submit feedback.');
      setAuthOpen(true);
      return;
    }
    if (!message.trim()) return;
    if (category === 'other' && !otherLabel.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await insertFeedback({
        category,
        other_label: category === 'other' ? otherLabel.trim() : undefined,
        message: message.trim(),
      });
      setSuccess(true);
      setCategory('feature_request');
      setOtherLabel('');
      setMessage('');
    } catch (submitError) {
      if (submitError instanceof Error && submitError.message === 'Not authenticated') {
        setError('Please sign in to submit feedback.');
        setAuthOpen(true);
      } else {
        setError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NewsShell>
      <div className="feedback-page">
        <h1 className="feedback-page__title">Submit Feedback</h1>
        <p className="feedback-page__subtitle">
          Share a feature request, report a bug, or send us anything else on your mind.
        </p>
        {!session && (
          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <p className="feedback-page__subtitle" style={{ margin: 0 }}>
              Sign in is required before you can send feedback.
            </p>
            <button
              type="button"
              className="news-btn news-btn--primary"
              onClick={() => setAuthOpen(true)}
            >
              Sign In
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="article-editor__field">
            <label className="article-editor__label">Category</label>
            <div className="feedback-form__categories">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`feedback-form__cat-btn${category === c.value ? ' feedback-form__cat-btn--active' : ''}`}
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {category === 'other' && (
            <div className="article-editor__field">
              <label className="article-editor__label">What is it? *</label>
              <input
                type="text"
                className="article-editor__input"
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                placeholder="Briefly describe what this feedback is about"
                maxLength={150}
                required
              />
            </div>
          )}

          <div className="article-editor__field">
            <label className="article-editor__label">
              Message *{' '}
              {category !== 'other' && (
                <span style={{ fontWeight: 400, opacity: 0.6 }}>
                  — {getCategoryLabel(category)}
                </span>
              )}
            </label>
            <textarea
              className="article-editor__textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                category === 'feature_request'
                  ? 'Describe the feature you would like to see...'
                  : category === 'bug'
                    ? 'Describe what happened and how to reproduce it...'
                    : 'Write your feedback here...'
              }
              rows={6}
              maxLength={2000}
              required
            />
          </div>

          <button
            type="submit"
            className="news-btn news-btn--primary"
            disabled={submitting || !message.trim() || (category === 'other' && !otherLabel.trim())}
          >
            {submitting ? 'Sending...' : 'Send Feedback'}
          </button>

          {success && (
            <p className="feedback-form__success">Your feedback has been sent. Thank you!</p>
          )}
          {error && <p className="feedback-form__error">{error}</p>}
        </form>
      </div>
      <NewsAuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </NewsShell>
  );
}
