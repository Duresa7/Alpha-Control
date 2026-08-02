import { useGalaxyDataStore } from '@/store/galaxyDataStore';

export function GalaxyLoading({ caption }: { caption: string }) {
  return (
    <section
      className="galaxy-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={caption}
    >
      <div className="galaxy-loading__stars" aria-hidden="true" />

      <div className="galaxy-loading__content">
        <div className="galaxy-loading__core" aria-hidden="true">
          <span className="galaxy-loading__orbit" />
          <span className="galaxy-loading__echo" />
          <span className="galaxy-loading__dot" />
        </div>

        <h1 className="galaxy-loading__title">Galaxy Map</h1>

        <div className="galaxy-loading__track" aria-hidden="true">
          <span />
        </div>

        <p className="galaxy-loading__caption">{caption}</p>
      </div>
    </section>
  );
}

export function LoadingScreen() {
  const isLoading = useGalaxyDataStore((s) => s.isLoading);

  if (!isLoading) return null;

  return <GalaxyLoading caption="Initializing navicomputer" />;
}
