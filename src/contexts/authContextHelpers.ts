import { createContext } from 'react';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { withTimeout } from '@/utils/withTimeout';
import {
  clearPendingGoogleAuthIntent,
  createPendingGoogleAuthIntent,
  finalizePendingGoogleSignup,
  type GoogleAuthMode,
  readPendingGoogleAuthIntent,
  writePendingGoogleAuthIntent,
} from '@/utils/googleAuth';

const PROFILE_FETCH_EVENTS: readonly AuthChangeEvent[] = [
  'INITIAL_SESSION',
  'SIGNED_IN',
  'USER_UPDATED',
] as const;

export type ProfileFetchMode = 'initial' | 'background';
export type AuthResolutionEvent = AuthChangeEvent | 'MANUAL';

export interface GoogleSignInOptions {
  mode: GoogleAuthMode;
  displayName?: string;
  galaxyMapRequested?: boolean;
  redirectTo?: string;
}

export interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  authResolved: boolean;
  profileLoadingInitial: boolean;
  profileRefreshing: boolean;
  profileError: string | null;
  supabaseConfigured: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    galaxyMapRequested?: boolean,
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (options: GoogleSignInOptions) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateEmail: (newEmail: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface LoggerLike {
  error: (...args: unknown[]) => void;
}

export function getProfileFetchMode({
  previousSessionUserId,
  nextSessionUserId,
  resolvedProfileUserId,
}: {
  previousSessionUserId: string | null;
  nextSessionUserId: string | null;
  resolvedProfileUserId: string | null;
}): ProfileFetchMode | null {
  if (!nextSessionUserId) return null;
  if (previousSessionUserId !== nextSessionUserId || resolvedProfileUserId !== nextSessionUserId) {
    return 'initial';
  }
  return 'background';
}

export function shouldFetchProfileForEvent(
  event: AuthResolutionEvent,
  fetchMode: ProfileFetchMode | null,
): boolean {
  if (!fetchMode) return false;
  if (fetchMode === 'initial') return true;
  if (event === 'MANUAL') return true;
  return PROFILE_FETCH_EVENTS.includes(event);
}

export async function syncPendingGoogleAuthSession({
  session,
  supabaseConfigured,
  supabase,
  resolvedProfileUserId,
  fetchProfile,
  authOperationTimeoutMs,
  logger,
}: {
  session: Session | null;
  supabaseConfigured: boolean;
  supabase: SupabaseClient;
  resolvedProfileUserId: string | null;
  fetchProfile: (userId: string, mode: ProfileFetchMode) => Promise<void> | void;
  authOperationTimeoutMs: number;
  logger: LoggerLike;
}): Promise<void> {
  if (!supabaseConfigured || !session?.user || !readPendingGoogleAuthIntent()) {
    return;
  }

  await finalizePendingGoogleSignup({
    session,
    supabase,
    resolvedProfileUserId,
    fetchProfile,
    authOperationTimeoutMs,
    logger,
  });
}

export async function startGoogleSignIn({
  options,
  supabaseConfigured,
  supabase,
  redirectTimeoutMs,
}: {
  options: GoogleSignInOptions;
  supabaseConfigured: boolean;
  supabase: SupabaseClient;
  redirectTimeoutMs: number;
}): Promise<{ error: string | null }> {
  if (!supabaseConfigured) {
    return { error: 'Supabase is not configured' };
  }

  try {
    const authRedirectTo = options.redirectTo?.trim() || window.location.href;
    writePendingGoogleAuthIntent(
      createPendingGoogleAuthIntent({
        mode: options.mode,
        displayName: options.displayName,
        galaxyMapRequested: options.galaxyMapRequested,
      }),
    );

    const { error } = await withTimeout(
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: authRedirectTo,
        },
      }),
      redirectTimeoutMs,
      'Google sign-in timed out. Please try again.',
    );

    if (error) {
      clearPendingGoogleAuthIntent();
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    clearPendingGoogleAuthIntent();
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to continue with Google. Please try again.',
    };
  }
}
