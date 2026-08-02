type GoogleAuthButtonMode = 'login' | 'signup';

interface GoogleAuthButtonProps {
  mode: GoogleAuthButtonMode;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  containerClassName: string;
  buttonClassName: string;
  dividerClassName: string;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.95h5.5c-.24 1.27-.97 2.34-2.06 3.06l3.33 2.58c1.94-1.79 3.06-4.42 3.06-7.54 0-.72-.06-1.41-.18-2.05H12Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.78 0 5.11-.92 6.81-2.49l-3.33-2.58c-.92.62-2.1.99-3.48.99-2.67 0-4.94-1.8-5.75-4.23l-3.44 2.65A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#4A90E2"
        d="M6.25 13.69A6.01 6.01 0 0 1 5.93 12c0-.59.11-1.17.32-1.69L2.81 7.66A10 10 0 0 0 2 12c0 1.62.39 3.15 1.09 4.51l3.16-2.82Z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.08c1.51 0 2.87.52 3.94 1.53l2.95-2.95C17.1 2.98 14.77 2 12 2A9.99 9.99 0 0 0 3.09 7.49l3.16 2.82C7.06 7.88 9.33 6.08 12 6.08Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  mode,
  loading,
  disabled,
  onClick,
  containerClassName,
  buttonClassName,
  dividerClassName,
}: GoogleAuthButtonProps) {
  return (
    <div className={containerClassName}>
      <button type="button" className={buttonClassName} onClick={onClick} disabled={disabled}>
        <GoogleIcon />
        <span>
          {loading
            ? 'Redirecting...'
            : mode === 'login'
              ? 'Continue with Google'
              : 'Sign up with Google'}
        </span>
      </button>
      <div className={dividerClassName} aria-hidden="true">
        <span>or use email</span>
      </div>
    </div>
  );
}
