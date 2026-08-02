import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { GalaxyLoading } from '@/components/panels/LoadingScreen';

const MAP_LOADING_DURATION_MS = 1600;

export function MapLoadingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate('/map', { replace: true });
    }, MAP_LOADING_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  return <GalaxyLoading caption="Plotting hyperspace lanes" />;
}
