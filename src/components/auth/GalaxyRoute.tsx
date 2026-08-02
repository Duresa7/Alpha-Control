import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { GalaxyLoading } from '@/components/panels/LoadingScreen';

const AUTH_GUARD_TIMEOUT_MS = 8_000;

export function GalaxyRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, supabaseConfigured } = useAuth();
  const { canAccessGalaxy } = useRole();
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
    return <GalaxyLoading caption="Verifying clearance" />;
  }

  if (!session) {
    return <Navigate to="/" replace state={{ showAuthModal: true, from: location.pathname }} />;
  }

  if (!canAccessGalaxy) {
    return (
      <div className="galaxy-access-denied">
        <div className="galaxy-access-denied__card">
          <p className="galaxy-access-denied__eyebrow">Galaxy Map</p>
          <h2 className="galaxy-access-denied__title">Access Restricted</h2>
          <p className="galaxy-access-denied__copy">
            Galaxy Map access requires approval.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
