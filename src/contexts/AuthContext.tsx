import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AuthContext,
  getProfileFetchMode,
  shouldFetchProfileForEvent,
  startGoogleSignIn,
  syncPendingGoogleAuthSession,
  type AuthResolutionEvent,
  type GoogleSignInOptions,
  type ProfileFetchMode,
} from '@/contexts/authContextHelpers';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { deleteAccount as deleteAccountRequest } from '@/data/supabaseStorage';
import { withTimeout } from '@/utils/withTimeout';
import { clearPendingGoogleAuthIntent } from '@/utils/googleAuth';
import { logger } from '@/utils/logger';
import type { UserProfile } from '@/types';

const AUTH_OPERATION_TIMEOUT_MS = 15_000;
const INITIAL_AUTH_TIMEOUT_MS = 7_000;
const SESSION_BOOTSTRAP_TIMEOUT_MS = 4_000;
const GOOGLE_AUTH_REDIRECT_TIMEOUT_MS = 20_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [authResolved, setAuthResolved] = useState(!supabaseConfigured);
  const [profileLoadingInitial, setProfileLoadingInitial] = useState(false);
  const [profileRefreshing, setProfileRefreshing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const initialAuthResolvedRef = useRef(!supabaseConfigured);
  const sessionUserIdRef = useRef<string | null>(null);
  const resolvedProfileUserIdRef = useRef<string | null>(null);
  const profileInitialRequestsInFlightRef = useRef(0);
  const profileRefreshRequestsInFlightRef = useRef(0);
  const googleIntentSyncInFlightRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, mode: ProfileFetchMode) => {
    if (!supabaseConfigured) return;
    if (mode === 'initial') {
      profileInitialRequestsInFlightRef.current += 1;
      setProfileLoadingInitial(true);
    } else {
      profileRefreshRequestsInFlightRef.current += 1;
      setProfileRefreshing(true);
    }
    setProfileError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch profile:', error);
        if (sessionUserIdRef.current === userId) {
          setProfileError(error.message);
        }
        return;
      }

      // Ignore stale profile results from an outdated session.
      if (sessionUserIdRef.current !== userId) {
        return;
      }
      setProfile((data as UserProfile | null) ?? null);
      resolvedProfileUserIdRef.current = userId;
      setProfileError(null);
    } catch (error) {
      logger.error('Failed to fetch profile:', error);
      if (sessionUserIdRef.current === userId) {
        setProfileError(error instanceof Error ? error.message : 'Unable to refresh profile.');
      }
    } finally {
      if (mode === 'initial') {
        profileInitialRequestsInFlightRef.current = Math.max(
          0,
          profileInitialRequestsInFlightRef.current - 1,
        );
        if (profileInitialRequestsInFlightRef.current === 0) {
          setProfileLoadingInitial(false);
        }
      } else {
        profileRefreshRequestsInFlightRef.current = Math.max(
          0,
          profileRefreshRequestsInFlightRef.current - 1,
        );
        if (profileRefreshRequestsInFlightRef.current === 0) {
          setProfileRefreshing(false);
        }
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      const mode = resolvedProfileUserIdRef.current === session.user.id ? 'background' : 'initial';
      await fetchProfile(session.user.id, mode);
    }
  }, [session, fetchProfile]);

  const finalizePendingGoogleAuth = useCallback(
    async (newSession: Session | null) => {
      const userId = newSession?.user?.id ?? null;
      if (!userId || googleIntentSyncInFlightRef.current === userId) {
        return;
      }

      googleIntentSyncInFlightRef.current = userId;

      try {
        await syncPendingGoogleAuthSession({
          session: newSession,
          supabaseConfigured,
          supabase,
          resolvedProfileUserId: resolvedProfileUserIdRef.current,
          fetchProfile,
          authOperationTimeoutMs: AUTH_OPERATION_TIMEOUT_MS,
          logger,
        });
      } finally {
        googleIntentSyncInFlightRef.current = null;
      }
    },
    [fetchProfile],
  );

  useEffect(() => {
    if (!supabaseConfigured) return;

    initialAuthResolvedRef.current = false;

    const resolveAuthState = (newSession: Session | null, event: AuthResolutionEvent) => {
      const previousSessionUserId = sessionUserIdRef.current;
      const nextSessionUserId = newSession?.user?.id ?? null;
      sessionUserIdRef.current = nextSessionUserId;
      setSession(newSession);

      if (nextSessionUserId) {
        const profileFetchMode = getProfileFetchMode({
          previousSessionUserId,
          nextSessionUserId,
          resolvedProfileUserId: resolvedProfileUserIdRef.current,
        });
        if (profileFetchMode && shouldFetchProfileForEvent(event, profileFetchMode)) {
          void fetchProfile(nextSessionUserId, profileFetchMode);
        }
        void finalizePendingGoogleAuth(newSession);
      } else {
        resolvedProfileUserIdRef.current = null;
        setProfile(null);
        setProfileLoadingInitial(false);
        setProfileRefreshing(false);
        setProfileError(null);
      }

      if (!initialAuthResolvedRef.current) {
        initialAuthResolvedRef.current = true;
        setLoading(false);
        setAuthResolved(true);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      resolveAuthState(newSession, event);
    });

    void withTimeout(
      supabase.auth.getSession(),
      SESSION_BOOTSTRAP_TIMEOUT_MS,
      'Session bootstrap timed out.',
    )
      .then(({ data }) => {
        resolveAuthState(data.session ?? null, 'MANUAL');
      })
      .catch(() => {});

    const timeout = window.setTimeout(() => {
      if (!initialAuthResolvedRef.current) {
        initialAuthResolvedRef.current = true;
        setLoading(false);
        setAuthResolved(true);
      }
    }, INITIAL_AUTH_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [fetchProfile, finalizePendingGoogleAuth]);

  useEffect(() => {
    if (!supabaseConfigured || !session?.user?.id) return;
    const interval = setInterval(() => {
      void fetchProfile(session.user.id, 'background');
    }, 60_000);
    return () => clearInterval(interval);
  }, [session, fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, galaxyMapRequested?: boolean) => {
      if (!supabaseConfigured) return { error: 'Supabase is not configured' };
      try {
        const { error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName,
                galaxy_map_requested: galaxyMapRequested ?? false,
              },
            },
          }),
          AUTH_OPERATION_TIMEOUT_MS,
          'Sign-up timed out. Please try again.',
        );
        if (error) return { error: error.message };
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unable to sign up. Please try again.',
        };
      }
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabaseConfigured) return { error: 'Supabase is not configured' };
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          AUTH_OPERATION_TIMEOUT_MS,
          'Sign-in timed out. Please try again.',
        );
        if (error) return { error: error.message };

        if (data.session) {
          setSession(data.session);
          if (data.session.user?.id) {
            sessionUserIdRef.current = data.session.user.id;
            const mode =
              resolvedProfileUserIdRef.current === data.session.user.id ? 'background' : 'initial';
            void fetchProfile(data.session.user.id, mode);
          }
        }
        setLoading(false);
        setAuthResolved(true);
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
        };
      }
    },
    [fetchProfile],
  );

  const signInWithGoogle = useCallback(async (options: GoogleSignInOptions) => {
    return startGoogleSignIn({
      options,
      supabaseConfigured,
      supabase,
      redirectTimeoutMs: GOOGLE_AUTH_REDIRECT_TIMEOUT_MS,
    });
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setLoading(false);
    setAuthResolved(true);
    setProfileLoadingInitial(false);
    setProfileRefreshing(false);
    setProfileError(null);
    resolvedProfileUserIdRef.current = null;
    sessionUserIdRef.current = null;
    clearPendingGoogleAuthIntent();
    if (!supabaseConfigured) return;

    try {
      const { error } = await withTimeout(
        supabase.auth.signOut({ scope: 'local' }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Sign-out timed out. Local session has been cleared.',
      );
      if (error) {
        logger.error('Failed to sign out from Supabase:', error);
      }
    } catch (error) {
      logger.error('Failed to sign out from Supabase:', error);
    }
  }, []);

  const updateEmail = useCallback(async (newEmail: string) => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ email: newEmail }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Email update timed out. Please try again.',
      );
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unable to update email. Please try again.',
      };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Password update timed out. Please try again.',
      );
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unable to update password. Please try again.',
      };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    if (!session?.access_token) return { error: 'Not authenticated' };
    const result = await deleteAccountRequest();
    if (!result.error) {
      setSession(null);
      setProfile(null);
      setLoading(false);
      setAuthResolved(true);
      setProfileLoadingInitial(false);
      setProfileRefreshing(false);
      setProfileError(null);
      resolvedProfileUserIdRef.current = null;
      sessionUserIdRef.current = null;
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        /* best-effort */
      }
    }
    return result;
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        authResolved,
        profileLoadingInitial,
        profileRefreshing,
        profileError,
        supabaseConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateEmail,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
