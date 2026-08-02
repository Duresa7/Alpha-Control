import { useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';

const MAP_LOADING_DURATION_MS = 1600;

export function MapLoadingPage() {
  const navigate = useNavigate();
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate('/map', { replace: true });
    }, MAP_LOADING_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

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
        <h1 className="route-auth-loading__title">Projecting star lanes</h1>
        <p className="route-auth-loading__copy">Calibrating the interactive galaxy map...</p>
        <div className="route-auth-loading__bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
