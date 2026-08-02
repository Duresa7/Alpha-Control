import { useState, useCallback, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'login' | 'signup';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /\d/.test(p), label: 'A digit' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

export { PASSWORD_RULES };

export function validateSignupSubmission({
  displayName,
  password,
  confirmPassword,
  requirePassword,
}: {
  displayName: string;
  password?: string;
  confirmPassword?: string;
  requirePassword: boolean;
}): { error: string | null; displayName: string | null } {
  const normalizedDisplayName = displayName.trim();
  if (!normalizedDisplayName) {
    return { error: 'Display name is required', displayName: null };
  }

  if (!requirePassword) {
    return { error: null, displayName: normalizedDisplayName };
  }

  const nextPassword = password ?? '';
  const failedRules = PASSWORD_RULES.filter((r) => !r.test(nextPassword));
  if (failedRules.length > 0) {
    return {
      error: `Password requires: ${failedRules.map((r) => r.label).join(', ')}`,
      displayName: null,
    };
  }

  if (nextPassword !== (confirmPassword ?? '')) {
    return { error: 'Passwords do not match', displayName: null };
  }

  return { error: null, displayName: normalizedDisplayName };
}

export function useAuthForm(onSuccess: () => void) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [galaxyMapRequested, setGalaxyMapRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = useCallback((options?: { keepSuccessMessage?: boolean }) => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setGalaxyMapRequested(false);
    setError(null);
    if (!options?.keepSuccessMessage) {
      setSuccessMessage(null);
    }
  }, []);

  const switchMode = useCallback(
    (newMode: Mode, options?: { keepSuccessMessage?: boolean }) => {
      setMode(newMode);
      resetForm(options);
    },
    [resetForm],
  );

  const passwordStrength =
    mode === 'signup' ? PASSWORD_RULES.filter((r) => r.test(password)).length : 0;

  const handleGoogleAuth = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    const validatedSignup =
      mode === 'signup'
        ? validateSignupSubmission({
            displayName,
            requirePassword: false,
          })
        : { error: null, displayName: null };

    if (validatedSignup.error) {
      setError(validatedSignup.error);
      return;
    }

    setGoogleSubmitting(true);
    try {
      const { error: err } = await signInWithGoogle({
        mode,
        displayName: validatedSignup.displayName ?? undefined,
        galaxyMapRequested: mode === 'signup' ? galaxyMapRequested : undefined,
        redirectTo: window.location.href,
      });

      if (err) {
        setError(err);
      }
    } finally {
      setGoogleSubmitting(false);
    }
  }, [displayName, galaxyMapRequested, mode, signInWithGoogle]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validatedSignup =
      mode === 'signup'
        ? validateSignupSubmission({
            displayName,
            password,
            confirmPassword,
            requirePassword: true,
          })
        : { error: null, displayName: null };

    if (validatedSignup.error) {
      setError(validatedSignup.error);
      return;
    }

    if (mode === 'signup') {
      setDisplayName(validatedSignup.displayName!);
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err);
          return;
        }
        onSuccess();
      } else {
        const { error: err } = await signUp(
          email,
          password,
          validatedSignup.displayName!,
          galaxyMapRequested,
        );
        if (err) {
          setError(err);
          return;
        }
        setSuccessMessage(
          "Account created! Check your email to confirm, then sign in. If you don't see it, check your spam folder.",
        );
        switchMode('login', { keepSuccessMessage: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    displayName,
    setDisplayName,
    galaxyMapRequested,
    setGalaxyMapRequested,
    error,
    submitting,
    googleSubmitting,
    successMessage,
    passwordStrength,
    switchMode,
    handleGoogleAuth,
    handleSubmit,
  };
}
