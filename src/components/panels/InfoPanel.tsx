import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, X } from 'lucide-react';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useRole } from '@/hooks/useRole';

import type { StarSystem, Fleet, InfoPanelData, ViewMode } from '@/types';
import { SystemInfo } from '@/components/panels/SystemInfo';
import { PlanetInfo } from '@/components/panels/PlanetInfo';
import { FleetInfo } from '@/components/panels/FleetInfo';

function resolvePanelData({
  infoPanelData,
  viewMode,
  selectedSystemId,
  selectedPlanetId,
  selectedFleetId,
  systems,
  fleets,
}: {
  infoPanelData: InfoPanelData | null;
  viewMode: ViewMode;
  selectedSystemId: string | null;
  selectedPlanetId: string | null;
  selectedFleetId: string | null;
  systems: StarSystem[];
  fleets: Fleet[];
}): InfoPanelData | null {
  if (viewMode === 'system' && selectedSystemId) {
    const system = systems.find((s) => s.id === selectedSystemId);
    if (!system) return null;

    const selectedPlanet = selectedPlanetId
      ? system.planets.find((p) => p.id === selectedPlanetId)
      : null;
    if (selectedPlanet) {
      return { type: 'planet', data: selectedPlanet };
    }

    return system.planets[0]
      ? { type: 'planet', data: system.planets[0] }
      : { type: 'system', data: system };
  }

  if (viewMode === 'fleet' && selectedFleetId) {
    const selectedFleet = fleets.find((f) => f.id === selectedFleetId);
    return selectedFleet ? { type: 'fleet', data: selectedFleet } : null;
  }

  if (infoPanelData?.type === 'planet') {
    const stale = infoPanelData.data;
    const sys = systems.find((s) => s.id === stale.systemId);
    const fresh = sys?.planets.find((p) => p.id === stale.id);
    if (fresh) return { type: 'planet', data: fresh };
  }

  if (infoPanelData?.type === 'system') {
    const fresh = systems.find((s) => s.id === infoPanelData.data.id);
    if (fresh) return { type: 'system', data: fresh };
  }

  if (infoPanelData?.type === 'fleet') {
    const fresh = fleets.find((f) => f.id === infoPanelData.data.id);
    if (fresh) return { type: 'fleet', data: fresh };
  }

  return infoPanelData;
}

export function InfoPanel() {
  const { isAdmin } = useRole();
  const infoPanelData = useGalaxySelectionStore((s) => s.infoPanelData);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const selectedSystemId = useGalaxySelectionStore((s) => s.selectedSystemId);
  const selectedPlanetId = useGalaxySelectionStore((s) => s.selectedPlanetId);
  const selectedFleetId = useGalaxySelectionStore((s) => s.selectedFleetId);
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);

  const panelData = useMemo(
    () =>
      resolvePanelData({
        infoPanelData,
        viewMode,
        selectedSystemId,
        selectedPlanetId,
        selectedFleetId,
        systems,
        fleets,
      }),
    [infoPanelData, viewMode, selectedSystemId, selectedPlanetId, selectedFleetId, systems, fleets],
  );

  const [collapsed, setCollapsed] = useState(false);
  const currentPanelId = panelData?.data?.id ?? null;

  if (!panelData) return null;

  const panelLabel = panelData.data.name;

  const handleClose = () => {
    setInfoPanelData(null);
    switch (viewMode) {
      case 'system':
        setSelectedPlanet(null);
        setSelectedSystem(null);
        break;
      case 'fleet':
        setSelectedFleet(null);
        break;
      default:
        setSelectedSystem(null);
    }
  };

  const renderPanelContent = (data: InfoPanelData) => {
    switch (data.type) {
      case 'system':
        return <SystemInfo system={data.data} editable={isAdmin} />;
      case 'planet':
        return <PlanetInfo planet={data.data} editable={isAdmin} />;
      case 'fleet':
        return <FleetInfo fleet={data.data} editable={isAdmin} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {collapsed ? (
        <motion.div
          key="collapsed"
          className="absolute z-50"
          style={{ top: '20px', right: '220px' }}
          initial={{ scale: 0.92 }}
          animate={{ scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div
            className="holo-panel flex items-center gap-3 cursor-pointer select-none"
            style={{ padding: '8px 14px' }}
            onClick={() => setCollapsed(false)}
            title="Expand panel"
          >
            <span
              className="text-[11px] uppercase tracking-widest text-white/60 font-semibold"
              style={{ fontFamily: '"Oxanium", monospace' }}
            >
              {panelLabel}
            </span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          className="absolute right-4 top-4 z-50 w-[30rem] max-h-[calc(100vh-2rem)]"
          initial={{ x: 24 }}
          animate={{ x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div
            className="holo-panel"
            style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
          >
            <div key={currentPanelId} className="holo-panel-content space-y-6">
              {renderPanelContent(panelData)}
            </div>
          </div>

          {/* Outside the panel: it scrolls, and these must stay reachable. */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
            <button
              onClick={() => setCollapsed(true)}
              className="holo-close-button"
              title="Hide panel"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={handleClose} className="holo-close-button" title="Close panel">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
