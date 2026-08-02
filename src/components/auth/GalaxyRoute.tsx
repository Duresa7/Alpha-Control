import { useEffect, useState, type CSSProperties } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;

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
    return (
      <section
        className="route-auth-loading"
        aria-label="Preparing interactive map"
        style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
      >
        <div className="route-auth-loading__layer route-auth-loading__layer--base" aria-hidden="true" />
        <div className="route-auth-loading__layer route-auth-loading__layer--grid" aria-hidden="true" />
        <div className="route-auth-loading__veil" aria-hidden="true" />
        <div className="route-auth-loading__card">
          <p className="route-auth-loading__eyebrow">Hyperspace Transition</p>
          <h2 className="route-auth-loading__title">Projecting star lanes</h2>
          <p className="route-auth-loading__copy">Calibrating the interactive galaxy map...</p>
          <div className="route-auth-loading__bar" aria-hidden="true"><span /></div>
        </div>
      </section>
    );
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
