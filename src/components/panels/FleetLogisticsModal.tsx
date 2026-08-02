import { useState, useMemo, Suspense } from 'react';
import { Minus, Rocket, X } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ShipModel } from '@/components/three/ModelLoader';
import { shipCatalog } from '@/data/shipCatalog';
import type { ShipCatalogEntry } from '@/data/shipCatalog';
import type { FleetShipEntry, ShipModelType } from '@/types';
import { useFactionStore } from '@/store/factionStore';
import { FactionEmblem } from '@/components/panels/FactionEmblem';
import { CustomShipQuantityControl } from '@/components/panels/CustomShipQuantityControl';
import {
  addOrIncrementCustomShipEntry,
  clampCustomShipQuantity,
  CUSTOM_SHIP_QUANTITY_MAX,
  CUSTOM_SHIP_QUANTITY_MIN,
} from '@/utils/fleetComposition';
import { CUSTOM_SHIP_CLASSES } from '@/constants/ships';

interface ShipCardPreviewProps {
  modelType: ShipModelType;
}

function ShipCardPreview({ modelType }: ShipCardPreviewProps) {
  return (
    <Canvas
      camera={{ position: [1.5, 0.9, 2.2], fov: 32 }}
      className="fleet-ship-preview-canvas"
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-3, 2, -3]} intensity={0.4} color="#4DD0E1" />
      <Environment preset="night" background={false} />
      <Suspense fallback={null}>
        <ShipModel
          type={modelType}
          position={new THREE.Vector3(0, 0, 0)}
          scale={2}
          rotation={[0, -Math.PI / 5, 0]}
        />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}

interface FleetLogisticsModalProps {
  onConfirm: (data: { name: string; faction: string; shipCount: number; modelType: ShipModelType; commander?: string; composition: FleetShipEntry[] }) => void;
  onCancel: () => void;
}

export function FleetLogisticsModal({ onConfirm, onCancel }: FleetLogisticsModalProps) {
  const [fleetName, setFleetName] = useState('Alpha Squadron');
  const [commander, setCommander] = useState('');
  const allFactions = useFactionStore((s) => s.factions);
  const [faction, setFaction] = useState(() => allFactions[0]?.id ?? 'galactic_republic');
  const [hangar, setHangar] = useState<FleetShipEntry[]>([]);
  const [customShipName, setCustomShipName] = useState('');
  const [customShipClass, setCustomShipClass] = useState<string>(CUSTOM_SHIP_CLASSES[0]);
  const [customShipQuantity, setCustomShipQuantity] = useState(CUSTOM_SHIP_QUANTITY_MIN);

  const totalUnits = useMemo(
    () => hangar.reduce((sum, entry) => sum + entry.quantity, 0),
    [hangar],
  );

  const addShipToHangar = (ship: ShipCatalogEntry) => {
    setHangar((prev) => {
      const existing = prev.find((e) => e.catalogId === ship.id);
      if (existing) {
        return prev.map((e) =>
          e.catalogId === ship.id ? { ...e, quantity: e.quantity + 1 } : e,
        );
      }
      return [
        ...prev,
        { catalogId: ship.id, name: ship.name, shipClass: ship.shipClass, modelType: ship.modelType, quantity: 1 },
      ];
    });
  };

  const removeShipFromHangar = (catalogId: string) => {
    setHangar((prev) => {
      const existing = prev.find((e) => e.catalogId === catalogId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((e) => e.catalogId !== catalogId);
      }
      return prev.map((e) =>
        e.catalogId === catalogId ? { ...e, quantity: e.quantity - 1 } : e,
      );
    });
  };

  const addCustomShipToHangar = () => {
    if (!customShipName.trim()) return;
    setHangar((prev) => addOrIncrementCustomShipEntry(prev, {
      name: customShipName,
      shipClass: customShipClass,
      quantityToAdd: customShipQuantity,
    }));
    setCustomShipName('');
    setCustomShipQuantity(CUSTOM_SHIP_QUANTITY_MIN);
  };

  const handleConfirm = () => {
    if (!fleetName.trim() || totalUnits === 0) return;
    const catalogEntries = hangar.filter((e) => !e.isCustomEntry);
    const primaryShip = catalogEntries.reduce<FleetShipEntry | null>((selected, entry) => {
      if (!selected || entry.quantity > selected.quantity) return entry;
      return selected;
    }, null);
    const modelType: ShipModelType = primaryShip?.modelType as ShipModelType
      ?? (faction === 'sith_empire' ? 'sith' : 'republic');
    onConfirm({
      name: fleetName.trim(),
      faction,
      shipCount: totalUnits,
      modelType,
      commander: commander.trim() || undefined,
      composition: hangar,
    });
  };

  return (
    <div className="fleet-modal-overlay" onClick={onCancel}>
      <div className="fleet-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="fleet-modal-header">
          <div className="fleet-modal-header-left">
            <Rocket className="fleet-modal-header-icon" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="fleet-modal-title">Fleet Logistics Interface</h2>
          </div>
          <button className="fleet-modal-close holo-close-button" onClick={onCancel}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="fleet-modal-body">
          <div className="fleet-modal-catalog">
            <div className="fleet-ship-grid">
              {shipCatalog.map((ship) => (
                <div key={ship.id} className="fleet-ship-card">
                  <div className="fleet-ship-card-preview">
                    <ShipCardPreview modelType={ship.modelType} />
                    <span className="fleet-ship-class-badge">{ship.shipClass}</span>
                  </div>
                  <div className="fleet-ship-card-info">
                    <h3 className="fleet-ship-card-name">{ship.name}</h3>
                    <p className="fleet-ship-card-desc">{ship.description}</p>
                    <button
                      className="fleet-ship-add-btn"
                      onClick={() => addShipToHangar(ship)}
                    >
                      Add to Fleet
                    </button>
                  </div>
                </div>
              ))}
              <div className="fleet-ship-card fleet-ship-card-custom">
                <div className="fleet-ship-card-preview fleet-custom-emblem-preview">
                  <FactionEmblem factionId={faction} size={64} />
                  <span className="fleet-ship-class-badge">Custom</span>
                </div>
                <div className="fleet-ship-card-info">
                  <input
                    type="text"
                    value={customShipName}
                    onChange={(e) => setCustomShipName(e.target.value)}
                    className="holo-input fleet-custom-name-input"
                    placeholder="Ship name..."
                    maxLength={30}
                  />
                  <select
                    value={customShipClass}
                    onChange={(e) => setCustomShipClass(e.target.value)}
                    className="holo-input fleet-custom-class-select"
                  >
                    {CUSTOM_SHIP_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <CustomShipQuantityControl
                    ariaLabel="Custom ship quantity"
                    clamp={clampCustomShipQuantity}
                    max={CUSTOM_SHIP_QUANTITY_MAX}
                    min={CUSTOM_SHIP_QUANTITY_MIN}
                    onChange={setCustomShipQuantity}
                    value={customShipQuantity}
                  />
                  <button
                    className="fleet-ship-add-btn"
                    onClick={addCustomShipToHangar}
                    disabled={!customShipName.trim()}
                  >
                    Add Custom Ship
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="fleet-modal-config">
            <div className="fleet-config-section">
              <label className="fleet-config-label">Fleet Designation</label>
              <input
                type="text"
                value={fleetName}
                onChange={(e) => setFleetName(e.target.value)}
                className="holo-input fleet-config-input"
                placeholder="Enter fleet name..."
                maxLength={30}
              />
            </div>

            <div className="fleet-config-section">
              <label className="fleet-config-label">Commander</label>
              <input
                type="text"
                value={commander}
                onChange={(e) => setCommander(e.target.value)}
                className="holo-input fleet-config-input"
                placeholder="Enter commander name..."
                maxLength={40}
              />
            </div>

            <div className="fleet-config-section">
              <label className="fleet-config-label">Allegiance</label>
              <div className="fleet-config-select-wrap">
                <select
                  value={faction}
                  onChange={(e) => setFaction(e.target.value)}
                  className="holo-input fleet-config-select"
                >
                  {allFactions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fleet-config-section">
              <div className="fleet-config-units-header">
                <span className="fleet-config-label">Deployable Units</span>
                <span className="fleet-config-units-count">{totalUnits} Units</span>
              </div>
            </div>

            <div className="fleet-hangar">
              {hangar.length === 0 ? (
                <div className="fleet-hangar-empty">
                  <div className="fleet-hangar-empty-border">
                    <span>Hangar Empty</span>
                  </div>
                </div>
              ) : (
                <div className="fleet-hangar-list">
                  {hangar.map((entry) => (
                    <div key={entry.catalogId} className="fleet-hangar-entry">
                      <div className="fleet-hangar-entry-info">
                        {entry.isCustomEntry && <FactionEmblem factionId={faction} size={16} />}
                        <span className="fleet-hangar-entry-name">{entry.name}</span>
                        <span className="fleet-hangar-entry-class">{entry.shipClass}</span>
                      </div>
                      <div className="fleet-hangar-entry-controls">
                        <span className="fleet-hangar-entry-qty">×{entry.quantity}</span>
                        <button
                          className="fleet-hangar-remove-btn"
                          onClick={() => removeShipFromHangar(entry.catalogId)}
                          title="Remove one"
                        >
                          <Minus size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="fleet-modal-actions">
              <button
                className="holo-button fleet-confirm-btn"
                onClick={handleConfirm}
                disabled={!fleetName.trim() || totalUnits === 0}
              >
                Confirm Fleet
              </button>
              <button className="holo-button fleet-cancel-btn" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
