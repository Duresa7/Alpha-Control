import type { StarSystem } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import { InfoRow } from '@/components/panels/infoPanelShared';
import { formatRegion, capitalizeFirst } from '@/utils/format';
import { DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE } from '@/config/topDownMarkerConfig';

export function SystemInfo({ system, editable }: { system: StarSystem; editable: boolean }) {
  const removeCustomSystem = useGalaxyDataStore((s) => s.removeCustomSystem);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);
  const updateCustomSystemMarkerSize = useGalaxyDataStore((s) => s.updateCustomSystemMarkerSize);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);

  return (
    <div className="space-y-4">
      <div className="pb-3">
        <h2 className="text-xl font-semibold mb-2 holo-heading holo-heading-accent">
          {system.name}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="holo-badge border"
            style={{
              backgroundColor: `${getFactionBarColor(system.faction)}33`,
              color: getFactionBarColor(system.faction),
              borderColor: `${getFactionBarColor(system.faction)}4D`,
            }}
          >
            {getFactionLabel(system.faction)}
          </span>
          {system.isCustom && (
            <span className="holo-badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Custom
            </span>
          )}
        </div>
      </div>

      <div className="holo-divider" />

      <div className="holo-info-grid space-y-2">
        <InfoRow label="Region" value={formatRegion(system.region)} />
        <InfoRow label="Star Type" value={capitalizeFirst(system.starType)} />
        <InfoRow label="Importance" value={capitalizeFirst(system.importance)} />
      </div>

      {editable && viewMode === 'topdown' && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>
            Marker Size
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={system.markerSize ?? DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE}
              onChange={(e) => updateCustomSystemMarkerSize(system.id, parseFloat(e.target.value))}
              className="holo-slider flex-1"
            />
            <span className="holo-label-orbitron" style={{ width: '24px', textAlign: 'right' }}>
              {(system.markerSize ?? DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <p className="text-[14px] leading-relaxed holo-body-text">{system.description}</p>

      {system.planets.length > 0 && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>
            Planets ({system.planets.length})
          </label>
          <div className="space-y-1 mt-2">
            {system.planets.map((planet) => (
              <div
                key={planet.id}
                className="holo-info-row group cursor-pointer hover:bg-amber-500/5 transition-colors"
                onClick={() => {
                  setSelectedPlanet(planet.id);
                  setInfoPanelData({ type: 'planet', data: planet });
                }}
              >
                <span
                  className="text-[14px] group-hover:text-amber-200 transition-colors"
                  style={{ color: 'var(--holo-text-primary)' }}
                >
                  {planet.name}
                </span>
                <span
                  className="text-[12px] capitalize"
                  style={{ color: 'var(--holo-text-muted)' }}
                >
                  {planet.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {system.planets.some((p) => p.notable && p.notable.length > 0) && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>
            Notable Locations
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {system.planets.flatMap((p) =>
              (p.notable ?? []).map((loc) => (
                <span
                  key={`${p.id}-${loc}`}
                  className="holo-badge bg-cyan-900/30 border border-cyan-500/30 text-cyan-200"
                >
                  {loc}
                </span>
              )),
            )}
          </div>
        </div>
      )}

      {system.planets.length > 0 && (
        <div
          className="text-xs text-center animate-pulse holo-label-orbitron"
          style={{ color: 'var(--holo-text-muted)', fontSize: '11px' }}
        >
          Select a planet to open details
        </div>
      )}

      {editable && system.isCustom && (
        <button
          onClick={() => {
            removeCustomSystem(system.id);
            setInfoPanelData(null);
            setSelectedSystem(null);
          }}
          className="holo-button holo-button-danger holo-button-sm w-full mt-2"
        >
          Delete Custom System
        </button>
      )}
    </div>
  );
}
