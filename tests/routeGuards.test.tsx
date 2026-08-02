import { ReactNode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { BossmanRoute } from '@/components/auth/BossmanRoute';
import { GalaxyRoute } from '@/components/auth/GalaxyRoute';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { AuthContextValue } from '@/contexts/authContextHelpers';
import App from '@/App';

const authState = vi.hoisted(() => ({
  value: {
    session: null,
    profile: null,
    loading: false,
    authResolved: true,
    profileLoadingInitial: false,
    profileRefreshing: false,
    profileError: null,
    supabaseConfigured: true,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    updateEmail: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
  } as AuthContextValue,
}));

const roleState = vi.hoisted(() => ({
  value: {
    role: 'user',
    isAdmin: false,
    isBossman: false,
    isUser: true,
    canAccessGalaxy: false,
  } as {
    role: string;
    isAdmin: boolean;
    isBossman: boolean;
    isUser: boolean;
    canAccessGalaxy: boolean;
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState.value,
}));

vi.mock('@/hooks/useRole', () => ({
  useRole: () => roleState.value,
}));

function RouteProbe() {
  const location = useLocation();
  return <div data-testid="route-probe">{location.pathname}</div>;
}

function renderRoute(path: string, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<RouteProbe />} />
        <Route path="/map" element={<RouteProbe />} />
        <Route path="/news" element={<RouteProbe />} />
        <Route path="/guard" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('route guards', () => {
  beforeEach(() => {
    authState.value = {
      session: null,
      profile: null,
      loading: false,
      authResolved: true,
      profileLoadingInitial: false,
      profileRefreshing: false,
      profileError: null,
      supabaseConfigured: true,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
      updateEmail: vi.fn(),
      updatePassword: vi.fn(),
      deleteAccount: vi.fn(),
    };
    roleState.value = {
      role: 'user',
      isAdmin: false,
      isBossman: false,
      isUser: true,
      canAccessGalaxy: false,
    };
  });

  describe('App routing', () => {
    it('renders a public lazy route with its document title', async () => {
      render(
        <MemoryRouter initialEntries={['/privacy']}>
          <App />
        </MemoryRouter>,
      );

      expect(await screen.findByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeTruthy();
      await waitFor(() => {
        expect(document.title).toBe('AlphaSec United | Privacy Policy');
      });
    });

    it('redirects unauthenticated users from protected routes to sign in', async () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <App />
          <RouteProbe />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('route-probe').textContent).toBe('/');
      });
      expect(await screen.findByRole('heading', { name: 'Sign In', level: 2 })).toBeTruthy();
      await waitFor(() => {
        expect(document.title).toBe('AlphaSec United');
      });
    });

    it('redirects unknown routes to the public homepage', async () => {
      render(
        <MemoryRouter initialEntries={['/missing-route']}>
          <App />
          <RouteProbe />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('route-probe').textContent).toBe('/');
      });
      expect(screen.getByLabelText('Portfolio homepage')).toBeTruthy();
      expect(document.title).toBe('AlphaSec United');
    });
  });

  describe('ProtectedRoute', () => {
    it('shows loading before auth wait expires', () => {
      vi.useFakeTimers();
      authState.value.loading = true;

      renderRoute('/guard', <ProtectedRoute><div>allowed</div></ProtectedRoute>);

      expect(screen.getByText('Authenticating...')).toBeTruthy();
    });

    it('redirects unauthenticated users after the auth wait expires', () => {
      vi.useFakeTimers();
      authState.value.loading = true;

      renderRoute('/guard', <ProtectedRoute><div>allowed</div></ProtectedRoute>);

      act(() => {
        vi.advanceTimersByTime(8_000);
      });

      expect(screen.getByTestId('route-probe').textContent).toBe('/');
    });

    it('renders children for authenticated users', () => {
      authState.value.session = { user: { id: 'user-1' } } as never;

      renderRoute('/guard', <ProtectedRoute><div>allowed</div></ProtectedRoute>);

      expect(screen.getByText('allowed')).toBeTruthy();
    });
  });

  describe('GalaxyRoute', () => {
    it('shows the galaxy loading state while auth is pending', () => {
      vi.useFakeTimers();
      authState.value.loading = true;

      renderRoute('/guard', <GalaxyRoute><div>map</div></GalaxyRoute>);

      expect(screen.getByLabelText('Preparing interactive map')).toBeTruthy();
    });

    it('shows access denied for authenticated users without galaxy access', () => {
      authState.value.session = { user: { id: 'user-1' } } as never;

      renderRoute('/guard', <GalaxyRoute><div>map</div></GalaxyRoute>);

      expect(screen.getByText('Access Restricted')).toBeTruthy();
    });

    it('renders children for users with galaxy access', () => {
      authState.value.session = { user: { id: 'user-1' } } as never;
      roleState.value.canAccessGalaxy = true;

      renderRoute('/guard', <GalaxyRoute><div>map</div></GalaxyRoute>);

      expect(screen.getByText('map')).toBeTruthy();
    });
  });

  describe('AdminRoute', () => {
    it('shows loading while auth resolution is pending', () => {
      vi.useFakeTimers();
      authState.value.authResolved = false;

      renderRoute('/guard', <AdminRoute><div>admin</div></AdminRoute>);

      expect(screen.getByText('Verifying Access...')).toBeTruthy();
    });

    it('redirects authenticated non-admin users to the map', () => {
      authState.value.session = { user: { id: 'user-1' } } as never;

      renderRoute('/guard', <AdminRoute><div>admin</div></AdminRoute>);

      expect(screen.getByTestId('route-probe').textContent).toBe('/map');
    });

    it('renders children for admins', () => {
      authState.value.session = { user: { id: 'user-1' } } as never;
      roleState.value.isAdmin = true;

      renderRoute('/guard', <AdminRoute><div>admin</div></AdminRoute>);

      expect(screen.getByText('admin')).toBeTruthy();
    });
  });

  describe('BossmanRoute', () => {
    it('redirects unauthenticated users after the auth wait expires', () => {
      vi.useFakeTimers();
      authState.value.authResolved = false;

      renderRoute('/guard', <BossmanRoute fallbackTo="/news"><div>boss</div></BossmanRoute>);

      act(() => {
        vi.advanceTimersByTime(8_000);
      });

      expect(screen.getByTestId('route-probe').textContent).toBe('/');
    });

    it('redirects authenticated non-bossman users to the configured fallback', () => {
      authState.value.session = { user: { id: 'user-1' } } as never;

      renderRoute('/guard', <BossmanRoute fallbackTo="/news"><div>boss</div></BossmanRoute>);

      expect(screen.getByTestId('route-probe').textContent).toBe('/news');
    });

    it('renders children for bossman users', () => {
      authState.value.session = { user: { id: 'user-1' } } as never;
      roleState.value.isBossman = true;

      renderRoute('/guard', <BossmanRoute fallbackTo="/news"><div>boss</div></BossmanRoute>);

      expect(screen.getByText('boss')).toBeTruthy();
    });
  });
});
