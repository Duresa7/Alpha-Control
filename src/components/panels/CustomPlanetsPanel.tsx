import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Plus } from 'lucide-react';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { PlacementNotice } from '@/components/panels/PlacementNotice';
import { PlanetDesignerModal } from '@/components/panels/PlanetDesignerModal';

export function CustomPlanetsPanel() {
  const placementMode = useGalaxyUIStore((s) => s.placementMode);
  const setPlacementMode = useGalaxyUIStore((s) => s.setPlacementMode);
  const systems = useGalaxyDataStore((s) => s.systems);

  const [showDesigner, setShowDesigner] = useState(false);

  const customCount = systems.filter((s) => s.isCustom).length;

  return (
    <div className="holo-panel holo-panel-reset">
      <label className="holo-label holo-section-header">
        <span className="flex items-center gap-2">
          <Globe className="w-4 h-4 holo-icon-dim" aria-hidden="true" />
          Custom Planets
        </span>
      </label>

      <PlacementNotice
        active={placementMode}
        entityLabel="planet"
        onCancel={() => setPlacementMode(false)}
      />

      {!placementMode && (
        <button
          onClick={() => setShowDesigner(true)}
          className="holo-button holo-button-sm mt-3 w-full"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Design Planet</span>
        </button>
      )}

      {showDesigner &&
        createPortal(
          <PlanetDesignerModal
            onConfirm={(data) => {
              setPlacementMode(true, data);
              setShowDesigner(false);
            }}
            onCancel={() => setShowDesigner(false)}
          />,
          document.body,
        )}

      {customCount > 0 && (
        <p className="holo-meta-count">
          {customCount} custom planet{customCount !== 1 ? 's' : ''} placed
        </p>
      )}
    </div>
  );
}
