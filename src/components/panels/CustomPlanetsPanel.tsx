import { useState } from 'react';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import { PlacementNotice } from '@/components/panels/PlacementNotice';

export function CustomPlanetsPanel() {
  const placementMode = useGalaxyUIStore((s) => s.placementMode);
  const setPlacementMode = useGalaxyUIStore((s) => s.setPlacementMode);
  const systems = useGalaxyDataStore((s) => s.systems);
  const allFactions = useFactionStore((s) => s.factions);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanetName, setNewPlanetName] = useState('');
  const [newPlanetColor, setNewPlanetColor] = useState('#4DD0E1');
  const [newPlanetFaction, setNewPlanetFaction] = useState('neutral');

  const customCount = systems.filter(s => s.isCustom).length;

  return (
    <div className="holo-panel holo-panel-reset">
      <label
        className="holo-label holo-section-header"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 holo-icon-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Custom Planets
        </span>
      </label>

          <PlacementNotice active={placementMode} entityLabel="planet" onCancel={() => setPlacementMode(false)} />

          {showCreateForm && !placementMode ? (
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={newPlanetName}
                onChange={(e) => setNewPlanetName(e.target.value)}
                placeholder="Planet name"
                className="holo-input w-full px-3 py-2 text-[13px]"
                maxLength={30}
                autoFocus
              />
              <div className="space-y-1">
                <label className="holo-form-label-xs">Faction</label>
                <select
                  value={newPlanetFaction}
                  onChange={(e) => setNewPlanetFaction(e.target.value)}
                  className="holo-input w-full px-3 py-2 text-[13px]"
                >
                  {allFactions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="holo-form-label-xs">Color</label>
                <input
                  type="color"
                  value={newPlanetColor}
                  onChange={(e) => setNewPlanetColor(e.target.value)}
                  className="holo-color-input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newPlanetName.trim()) {
                      setPlacementMode(true, {
                        name: newPlanetName.trim(),
                        color: newPlanetColor,
                        faction: newPlanetFaction,
                      });
                      setShowCreateForm(false);
                    }
                  }}
                  disabled={!newPlanetName.trim()}
                  className="holo-button holo-button-sm flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-[11px]">Place on Map</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPlanetName('');
                    setNewPlanetFaction('neutral');
                  }}
                  className="holo-text-button px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : !placementMode && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="holo-button holo-button-sm mt-3 w-full"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Planet</span>
            </button>
          )}

          {customCount > 0 && (
            <p className="holo-meta-count">
              {customCount} custom planet{customCount !== 1 ? 's' : ''} placed
            </p>
          )}
    </div>
  );
}
