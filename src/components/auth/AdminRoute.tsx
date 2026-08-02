import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { shouldShowAdminLoading } from '@/utils/authGuard';

const AUTH_GUARD_TIMEOUT_MS = 8_000;

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, authResolved, profileLoadingInitial, supabaseConfigured } = useAuth();
  const { isAdmin } = useRole();
  const [authWaitExpired, setAuthWaitExpired] = useState(false);

  useEffect(() => {
    if (authResolved) {
      setAuthWaitExpired(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAuthWaitExpired(true);
    }, AUTH_GUARD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [authResolved]);

  if (!supabaseConfigured) {
    return <Navigate to="/" replace />;
  }

  if (shouldShowAdminLoading({
    authResolved,
    authWaitExpired,
    hasSession: !!session,
    profileLoadingInitial,
  })) {
    return (
      <div className="route-auth-loading">
        <div className="route-auth-loading__layer route-auth-loading__layer--base" />
        <div className="route-auth-loading__layer route-auth-loading__layer--grid" />
        <div className="route-auth-loading__veil" />
        <div className="route-auth-loading__card">
          <p className="route-auth-loading__eyebrow">Admin Panel</p>
          <h2 className="route-auth-loading__title">Verifying Access...</h2>
          <p className="route-auth-loading__copy">Checking authorization level.</p>
          <div className="route-auth-loading__bar"><span /></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ showAuthModal: true }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/map" replace />;
  }

  return <>{children}</>;
}
