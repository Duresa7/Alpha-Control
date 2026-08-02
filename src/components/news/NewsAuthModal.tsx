import { useAuthForm, PASSWORD_RULES } from '@/hooks/useAuthForm';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

interface NewsAuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewsAuthModal({ open, onClose }: NewsAuthModalProps) {
  const f = useAuthForm(onClose);

  if (!open) return null;

  return (
    <div className="news-auth__backdrop" onClick={onClose}>
      <div className="news-auth__card" onClick={(e) => e.stopPropagation()}>
        <button className="news-auth__close" onClick={onClose} aria-label="Close">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="news-auth__eyebrow">AlphaSec United</p>
        <h2 className="news-auth__title">
          {f.mode === 'login' ? 'Sign in to continue' : 'Create your account'}
        </h2>
        <p className="news-auth__subtitle">
          {f.mode === 'login'
            ? 'Sign in to like articles and join the conversation.'
            : 'Join the community to interact with articles.'}
        </p>

        {f.successMessage && <div className="news-auth__success">{f.successMessage}</div>}

        {f.error && <div className="news-auth__error">{f.error}</div>}

        <GoogleAuthButton
          mode={f.mode}
          loading={f.googleSubmitting}
          disabled={f.submitting || f.googleSubmitting}
          onClick={f.handleGoogleAuth}
          containerClassName="news-auth__oauth"
          buttonClassName="news-auth__oauth-button"
          dividerClassName="news-auth__divider"
        />

        <form onSubmit={f.handleSubmit} className="news-auth__form">
          {f.mode === 'signup' && (
            <div className="news-auth__field">
              <label className="news-auth__label">Display Name</label>
              <input
                type="text"
                value={f.displayName}
                onChange={(e) => f.setDisplayName(e.target.value)}
                className="news-auth__input"
                placeholder="Your name"
                maxLength={40}
                required
                autoFocus
              />
            </div>
          )}

          <div className="news-auth__field">
            <label className="news-auth__label">Email</label>
            <input
              type="email"
              value={f.email}
              onChange={(e) => f.setEmail(e.target.value)}
              className="news-auth__input"
              placeholder="you@example.com"
              required
              autoFocus={f.mode === 'login'}
            />
          </div>

          <div className="news-auth__field">
            <label className="news-auth__label">Password</label>
            <input
              type="password"
              value={f.password}
              onChange={(e) => f.setPassword(e.target.value)}
              className="news-auth__input"
              placeholder={
                f.mode === 'signup' ? 'Min 8 chars, mixed case, digit, special' : 'Your password'
              }
              required
            />
            {f.mode === 'signup' && f.password.length > 0 && (
              <div className="news-auth__strength">
                <div className="news-auth__strength-bar">
                  <div
                    className="news-auth__strength-fill"
                    style={{
                      width: `${(f.passwordStrength / PASSWORD_RULES.length) * 100}%`,
                      background:
                        f.passwordStrength <= 2
                          ? '#dc3545'
                          : f.passwordStrength <= 4
                            ? '#f0ad4e'
                            : '#1a73e8',
                    }}
                  />
                </div>
                <span className="news-auth__strength-label">
                  {f.passwordStrength <= 2 ? 'Weak' : f.passwordStrength <= 4 ? 'Fair' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {f.mode === 'signup' && (
            <div className="news-auth__field">
              <label className="news-auth__label">Confirm Password</label>
              <input
                type="password"
                value={f.confirmPassword}
                onChange={(e) => f.setConfirmPassword(e.target.value)}
                className="news-auth__input"
                placeholder="Re-enter password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={f.submitting || f.googleSubmitting}
            className="news-auth__submit"
          >
            {f.submitting ? 'Please wait...' : f.mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="news-auth__switch">
          {f.mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => f.switchMode('signup')}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => f.switchMode('login')}>
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
