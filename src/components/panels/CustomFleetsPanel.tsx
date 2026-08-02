import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Rocket } from 'lucide-react';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { FleetLogisticsModal } from '@/components/panels/FleetLogisticsModal';
import { PlacementNotice } from '@/components/panels/PlacementNotice';

export function CustomFleetsPanel() {
  const fleetPlacementMode = useGalaxyUIStore((s) => s.fleetPlacementMode);
  const setFleetPlacementMode = useGalaxyUIStore((s) => s.setFleetPlacementMode);
  const fleets = useGalaxyDataStore((s) => s.fleets);

  const [showFleetModal, setShowFleetModal] = useState(false);

  const customCount = fleets.filter((f) => f.isCustom).length;

  return (
    <div className="holo-panel holo-panel-reset">
      <label className="holo-label holo-section-header">
        <span className="flex items-center gap-2">
          <Rocket className="w-4 h-4 holo-icon-dim" aria-hidden="true" />
          Custom Fleets
        </span>
      </label>

      <PlacementNotice
        active={fleetPlacementMode}
        entityLabel="fleet"
        onCancel={() => setFleetPlacementMode(false)}
      />

      {!fleetPlacementMode && (
        <button
          onClick={() => setShowFleetModal(true)}
          className="holo-button holo-button-sm mt-3 w-full"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Create Fleet</span>
        </button>
      )}

      {showFleetModal &&
        createPortal(
          <FleetLogisticsModal
            onConfirm={(data) => {
              setFleetPlacementMode(true, {
                name: data.name,
                faction: data.faction,
                shipCount: data.shipCount,
                modelType: data.modelType,
                commander: data.commander,
                composition: data.composition,
              });
              setShowFleetModal(false);
            }}
            onCancel={() => setShowFleetModal(false)}
          />,
          document.body,
        )}

      {customCount > 0 && (
        <p className="holo-meta-count">
          {customCount} custom fleet{customCount !== 1 ? 's' : ''} placed
        </p>
      )}
    </div>
  );
}
