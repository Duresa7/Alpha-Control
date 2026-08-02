import { useAuthForm, PASSWORD_RULES } from '@/hooks/useAuthForm';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const f = useAuthForm(onClose);

  if (!open) return null;

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div className="auth-modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">
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

        <p className="auth-modal__eyebrow">Galaxy Map</p>
        <h2 className="auth-modal__title">{f.mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

        {f.successMessage && <div className="auth-modal__success">{f.successMessage}</div>}

        {f.error && <div className="auth-modal__error">{f.error}</div>}

        <GoogleAuthButton
          mode={f.mode}
          loading={f.googleSubmitting}
          disabled={f.submitting || f.googleSubmitting}
          onClick={f.handleGoogleAuth}
          containerClassName="auth-modal__oauth"
          buttonClassName="auth-modal__oauth-button"
          dividerClassName="auth-modal__divider"
        />

        <form onSubmit={f.handleSubmit} className="auth-modal__form">
          {f.mode === 'signup' && (
            <div className="auth-modal__field">
              <label className="auth-modal__label">Display Name</label>
              <input
                type="text"
                value={f.displayName}
                onChange={(e) => f.setDisplayName(e.target.value)}
                className="auth-modal__input"
                placeholder="Your name"
                maxLength={40}
                required
                autoFocus
              />
            </div>
          )}

          <div className="auth-modal__field">
            <label className="auth-modal__label">Email</label>
            <input
              type="email"
              value={f.email}
              onChange={(e) => f.setEmail(e.target.value)}
              className="auth-modal__input"
              placeholder="you@example.com"
              required
              autoFocus={f.mode === 'login'}
            />
          </div>

          <div className="auth-modal__field">
            <label className="auth-modal__label">Password</label>
            <input
              type="password"
              value={f.password}
              onChange={(e) => f.setPassword(e.target.value)}
              className="auth-modal__input"
              placeholder={
                f.mode === 'signup' ? 'Min 8 chars, mixed case, digit, special' : 'Your password'
              }
              required
            />
            {f.mode === 'signup' && f.password.length > 0 && (
              <div className="auth-modal__strength">
                <div className="auth-modal__strength-bar">
                  <div
                    className="auth-modal__strength-fill"
                    style={{
                      width: `${(f.passwordStrength / PASSWORD_RULES.length) * 100}%`,
                      background:
                        f.passwordStrength <= 2
                          ? '#dc3545'
                          : f.passwordStrength <= 4
                            ? '#f0ad4e'
                            : '#5cb85c',
                    }}
                  />
                </div>
                <span className="auth-modal__strength-label">
                  {f.passwordStrength <= 2 ? 'Weak' : f.passwordStrength <= 4 ? 'Fair' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {f.mode === 'signup' && (
            <div className="auth-modal__field">
              <label className="auth-modal__label">Confirm Password</label>
              <input
                type="password"
                value={f.confirmPassword}
                onChange={(e) => f.setConfirmPassword(e.target.value)}
                className="auth-modal__input"
                placeholder="Re-enter password"
                required
              />
            </div>
          )}

          {f.mode === 'signup' && (
            <div className="auth-modal__field auth-modal__field--checkbox">
              <label className="auth-modal__checkbox-label">
                <input
                  type="checkbox"
                  checked={f.galaxyMapRequested}
                  onChange={(e) => f.setGalaxyMapRequested(e.target.checked)}
                />
                I'm registering to access the Galaxy Map
              </label>
              {f.galaxyMapRequested && (
                <p className="auth-modal__galaxy-note">
                  An admin will review your request and grant access.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={f.submitting || f.googleSubmitting}
            className="auth-modal__submit"
          >
            {f.submitting ? 'Please wait...' : f.mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-modal__switch">
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
