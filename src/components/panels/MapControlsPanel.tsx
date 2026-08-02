import { motion } from 'framer-motion';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useFactionStore } from '@/store/factionStore';
import { FilterBox } from '@/components/panels/FilterBox';
import { FactionManagementPanel } from '@/components/panels/FactionManagementPanel';
import { useRole } from '@/hooks/useRole';
import { useState } from 'react';

export function MapControlsPanel() {
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const factionFilters = useGalaxyUIStore((s) => s.factionFilters);
  const toggleFactionFilter = useGalaxyUIStore((s) => s.toggleFactionFilter);
  const factions = useFactionStore((s) => s.factions);
  const showFleets = useGalaxyUIStore((s) => s.showFleets);
  const showLabels = useGalaxyUIStore((s) => s.showLabels);
  const showCivilianTraffic = useGalaxyUIStore((s) => s.showCivilianTraffic);
  const toggleFleets = useGalaxyUIStore((s) => s.toggleFleets);
  const toggleLabels = useGalaxyUIStore((s) => s.toggleLabels);
  const toggleCivilianTraffic = useGalaxyUIStore((s) => s.toggleCivilianTraffic);

  const { isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<'filters' | 'manage'>('filters');

  if (activeModule !== 'mapControls') return null;

  return (
    <motion.div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40"
      style={{ width: 'min(31rem, calc(100vw - 1.5rem))' }}
      initial={{ y: 16 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div>
        <div className="holo-panel map-controls-panel">
          <label className="holo-label holo-section-header mb-5 pointer-events-none">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Map Controls
            </span>
          </label>

          <div className="holo-tab-strip">
            <button
              onClick={() => setActiveTab('filters')}
              className={`holo-tab-button${activeTab === 'filters' ? ' is-active' : ''}`}
            >
              Filters
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`holo-tab-button${activeTab === 'manage' ? ' is-active' : ''}`}
              >
                Manage Factions
              </button>
            )}
          </div>

          {activeTab === 'filters' ? (
            <div className="space-y-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider mb-2.5 block" style={{ color: 'var(--holo-text-muted)' }}>Factions</span>
                <div className="grid grid-cols-2 gap-[10px]">
                  {factions.map((f) => (
                    <FilterBox
                      key={f.id}
                      active={factionFilters[f.id] ?? true}
                      onClick={() => toggleFactionFilter(f.id)}
                      label={f.label}
                      hexColor={f.barColor}
                    />
                  ))}
                </div>
              </div>

              <div className="holo-divider" />

              <div>
                <span className="text-[11px] uppercase tracking-wider mb-2.5 block" style={{ color: 'var(--holo-text-muted)' }}>Layers</span>
                <div className="grid grid-cols-2 gap-[10px]">
                  <FilterBox active={showFleets} onClick={toggleFleets} label="Fleets" color="red" />
                  <FilterBox active={showLabels} onClick={toggleLabels} label="Labels" color="yellow" />
                  <FilterBox
                    active={showCivilianTraffic}
                    onClick={toggleCivilianTraffic}
                    label="Civilian Traffic"
                    color="cyan"
                  />
                </div>
              </div>
            </div>
          ) : (
            <FactionManagementPanel isFloatingMode={true} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
