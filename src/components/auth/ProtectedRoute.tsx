import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

const AUTH_GUARD_TIMEOUT_MS = 8_000;

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, supabaseConfigured } = useAuth();
  const location = useLocation();
  const [authWaitExpired, setAuthWaitExpired] = useState(false);

  useEffect(() => {
    if (!loading || session) {
      setAuthWaitExpired(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAuthWaitExpired(true);
    }, AUTH_GUARD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [loading, session]);
  if (!supabaseConfigured) {
    return <Navigate to="/" replace />;
  }

  if (loading && !session && !authWaitExpired) {
    return (
      <div className="route-auth-loading">
        <div className="route-auth-loading__layer route-auth-loading__layer--base" />
        <div className="route-auth-loading__layer route-auth-loading__layer--grid" />
        <div className="route-auth-loading__veil" />
        <div className="route-auth-loading__card">
          <p className="route-auth-loading__eyebrow">Galaxy Map</p>
          <h2 className="route-auth-loading__title">Authenticating...</h2>
          <p className="route-auth-loading__copy">Verifying your clearance level.</p>
          <div className="route-auth-loading__bar"><span /></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ showAuthModal: true, from: location.pathname }} />;
  }

  return <>{children}</>;
}
