import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    authCallback: null as ((event: string, session: unknown) => void) | null,
    getSessionResult: Promise.resolve({ data: { session: null } }),
    signInResult: Promise.resolve({ data: { session: null }, error: null }),
    signOutResult: Promise.resolve({ error: null }),
    profileResponses: new Map<
      string,
      Promise<{ data: unknown; error: unknown }> | { data: unknown; error: unknown }
    >(),
  };

  const subscription = {
    unsubscribe: vi.fn(),
  };

  const profileMaybeSingle = vi.fn((userId: string) => {
    const response = state.profileResponses.get(userId);
    if (response instanceof Promise) {
      return response;
    }
    return Promise.resolve(response ?? { data: null, error: null });
  });

  return {
    state,
    subscription,
    profileMaybeSingle,
    onAuthStateChange: vi.fn((callback: (event: string, session: unknown) => void) => {
      state.authCallback = callback;
      return { data: { subscription } };
    }),
    getSession: vi.fn(() => state.getSessionResult),
    signInWithPassword: vi.fn(() => state.signInResult),
    signOut: vi.fn(() => state.signOutResult),
    signUp: vi.fn(async () => ({ error: null })),
    updateUser: vi.fn(async () => ({ error: null })),
    from: vi.fn((table: string) => {
      if (table !== 'profiles') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn((_field: string, userId: string) => ({
            maybeSingle: vi.fn(() => profileMaybeSingle(userId)),
          })),
        })),
      };
    }),
    deleteAccountRequest: vi.fn(async () => ({ error: null })),
    clearPendingGoogleAuthIntent: vi.fn(),
    syncPendingGoogleAuthSession: vi.fn(async () => {}),
    startGoogleSignIn: vi.fn(async () => ({ error: null })),
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
    },
  };
});

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    from: mocks.from,
    auth: {
      onAuthStateChange: mocks.onAuthStateChange,
      getSession: mocks.getSession,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      signUp: mocks.signUp,
      updateUser: mocks.updateUser,
    },
  },
}));

vi.mock('@/data/supabaseStorage', () => ({
  deleteAccount: mocks.deleteAccountRequest,
}));

vi.mock('@/utils/googleAuth', async () => {
  const actual = await vi.importActual<typeof import('@/utils/googleAuth')>('@/utils/googleAuth');
  return {
    ...actual,
    clearPendingGoogleAuthIntent: mocks.clearPendingGoogleAuthIntent,
  };
});

vi.mock('@/contexts/authContextHelpers', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/authContextHelpers')>(
    '@/contexts/authContextHelpers',
  );
  return {
    ...actual,
    syncPendingGoogleAuthSession: mocks.syncPendingGoogleAuthSession,
    startGoogleSignIn: mocks.startGoogleSignIn,
  };
});

vi.mock('@/utils/logger', () => ({
  logger: mocks.logger,
}));

import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function session(userId: string) {
  return {
    access_token: `${userId}-token`,
    user: { id: userId },
  } as never;
}

function Probe() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="session">{auth.session?.user?.id ?? 'none'}</div>
      <div data-testid="profile">{auth.profile?.display_name ?? 'none'}</div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="resolved">{String(auth.authResolved)}</div>
      <button onClick={() => void auth.signIn('user@example.com', 'password')}>sign-in</button>
      <button onClick={() => void auth.signOut()}>sign-out</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mocks.state.authCallback = null;
    mocks.state.getSessionResult = Promise.resolve({ data: { session: null } });
    mocks.state.signInResult = Promise.resolve({ data: { session: null }, error: null });
    mocks.state.signOutResult = Promise.resolve({ error: null });
    mocks.state.profileResponses = new Map();

    mocks.onAuthStateChange.mockClear();
    mocks.getSession.mockClear();
    mocks.signInWithPassword.mockClear();
    mocks.signOut.mockClear();
    mocks.from.mockClear();
    mocks.profileMaybeSingle.mockClear();
    mocks.subscription.unsubscribe.mockClear();
    mocks.clearPendingGoogleAuthIntent.mockClear();
    mocks.syncPendingGoogleAuthSession.mockClear();
  });

  it('bootstraps the session and profile from getSession', async () => {
    mocks.state.getSessionResult = Promise.resolve({ data: { session: session('user-1') } });
    mocks.state.profileResponses.set('user-1', {
      data: {
        id: 'user-1',
        display_name: 'Ahsoka Tano',
        role: 'admin',
      },
      error: null,
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('session').textContent).toBe('user-1');
      expect(screen.getByTestId('profile').textContent).toBe('Ahsoka Tano');
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('resolved').textContent).toBe('true');
    });
  });

  it('ignores stale profile responses after the session changes', async () => {
    const firstProfile = deferred<{ data: unknown; error: unknown }>();

    mocks.state.profileResponses.set('user-1', firstProfile.promise);
    mocks.state.profileResponses.set(
      'user-2',
      Promise.resolve({
        data: {
          id: 'user-2',
          display_name: 'Bo-Katan Kryze',
          role: 'user',
        },
        error: null,
      }),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mocks.state.authCallback).not.toBeNull();
    });

    mocks.state.authCallback?.('SIGNED_IN', session('user-1'));
    mocks.state.authCallback?.('SIGNED_IN', session('user-2'));

    await waitFor(() => {
      expect(screen.getByTestId('session').textContent).toBe('user-2');
      expect(screen.getByTestId('profile').textContent).toBe('Bo-Katan Kryze');
    });

    firstProfile.resolve({
      data: {
        id: 'user-1',
        display_name: 'Stale Profile',
        role: 'user',
      },
      error: null,
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile').textContent).toBe('Bo-Katan Kryze');
    });
  });

  it('updates state on sign-in and clears it immediately on sign-out', async () => {
    const signOutDeferred = deferred<{ error: null }>();

    mocks.state.signInResult = Promise.resolve({
      data: { session: session('user-1') },
      error: null,
    });
    mocks.state.signOutResult = signOutDeferred.promise;
    mocks.state.profileResponses.set('user-1', {
      data: {
        id: 'user-1',
        display_name: 'Din Djarin',
        role: 'user',
      },
      error: null,
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('sign-in'));

    await waitFor(() => {
      expect(screen.getByTestId('session').textContent).toBe('user-1');
      expect(screen.getByTestId('profile').textContent).toBe('Din Djarin');
    });

    fireEvent.click(screen.getByText('sign-out'));

    expect(screen.getByTestId('session').textContent).toBe('none');
    expect(screen.getByTestId('profile').textContent).toBe('none');
    expect(mocks.clearPendingGoogleAuthIntent).toHaveBeenCalledTimes(1);

    signOutDeferred.resolve({ error: null });
    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
    });
  });

  it('syncs pending google auth for signed-in sessions only', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mocks.state.authCallback).not.toBeNull();
    });

    mocks.state.profileResponses.set('user-3', {
      data: {
        id: 'user-3',
        display_name: 'Leia Organa',
        role: 'bossman',
      },
      error: null,
    });

    mocks.state.authCallback?.('SIGNED_IN', session('user-3'));
    mocks.state.authCallback?.('SIGNED_OUT', null);

    await waitFor(() => {
      expect(mocks.syncPendingGoogleAuthSession).toHaveBeenCalledTimes(1);
    });
    expect(mocks.syncPendingGoogleAuthSession).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({
          user: expect.objectContaining({ id: 'user-3' }),
        }),
        supabaseConfigured: true,
      }),
    );
  });
});
