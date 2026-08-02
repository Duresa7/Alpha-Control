import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Fleet, FleetShipEntry, ShipModelType } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import { useEditableField } from '@/hooks/useEditableField';
import {
  FLEET_STRENGTH_SEGMENTS,
  FLEET_STRENGTH_DIVISOR,
  FLEET_STRENGTH_LIGHT_THRESHOLD,
  FLEET_STRENGTH_HEAVY_THRESHOLD,
} from '@/constants/factions';
import { EditableInfoRow, InfoRow } from '@/components/panels/infoPanelShared';
import { DEFAULT_TOPDOWN_FLEET_MARKER_SIZE } from '@/config/topDownMarkerConfig';
import { FactionEmblem } from '@/components/panels/FactionEmblem';
import { CustomShipQuantityControl } from '@/components/panels/CustomShipQuantityControl';
import { shipCatalog } from '@/data/shipCatalog';
import {
  addOrIncrementCustomShipEntry,
  clampCustomShipQuantity,
  CUSTOM_SHIP_QUANTITY_MAX,
  CUSTOM_SHIP_QUANTITY_MIN,
} from '@/utils/fleetComposition';
import { CUSTOM_SHIP_CLASSES } from '@/constants/ships';

const MODEL_TYPE_LABELS: Record<ShipModelType, string> = {
  republic: 'Republic',
  sith: 'Sith',
  valor: 'Valor',
  terminus: 'Terminus',
};

const MODEL_BADGES: Record<ShipModelType, string> = {
  republic: 'REP',
  sith: 'SIT',
  valor: 'VAL',
  terminus: 'TER',
};

function CompositionEntry({
  entry,
  factionId,
  editable,
  onAdd,
  onRemove,
}: {
  entry: FleetShipEntry;
  factionId: string;
  editable: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="fleet-composition-entry">
      <div className="fleet-composition-entry-left">
        {entry.isCustomEntry || !entry.modelType ? (
          <FactionEmblem factionId={factionId} size={20} />
        ) : (
          <span className="fleet-composition-model-badge">{MODEL_BADGES[entry.modelType]}</span>
        )}
        <div className="fleet-composition-entry-text">
          <span className="fleet-composition-entry-name">{entry.name}</span>
          <span className="fleet-composition-entry-class">{entry.shipClass}</span>
        </div>
      </div>
      <div className="fleet-composition-entry-right">
        {editable && (
          <button className="fleet-composition-qty-btn" onClick={onRemove}>
            <Minus size={10} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
        <span className="fleet-composition-entry-qty">{entry.quantity}</span>
        {editable && (
          <button className="fleet-composition-qty-btn" onClick={onAdd}>
            <Plus size={10} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FleetInfo({ fleet, editable }: { fleet: Fleet; editable: boolean }) {
  const removeCustomFleet = useGalaxyDataStore((s) => s.removeCustomFleet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const updateFleetMarkerSize = useGalaxyDataStore((s) => s.updateFleetMarkerSize);
  const updateFleetStats = useGalaxyDataStore((s) => s.updateFleetStats);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const allFactions = useFactionStore((s) => s.factions);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);

  const nameField = useEditableField();
  const commanderField = useEditableField();
  const shipCountField = useEditableField();

  // Inline add form state
  const [addMode, setAddMode] = useState<'catalog' | 'custom' | null>(null);
  const [addCatalogId, setAddCatalogId] = useState(shipCatalog[0]?.id ?? '');
  const [addCustomName, setAddCustomName] = useState('');
  const [addCustomClass, setAddCustomClass] = useState<string>(CUSTOM_SHIP_CLASSES[0]);
  const [addCustomQuantity, setAddCustomQuantity] = useState(CUSTOM_SHIP_QUANTITY_MIN);

  const markerSize = fleet.markerSize ?? DEFAULT_TOPDOWN_FLEET_MARKER_SIZE;
  const filledSegments = Math.min(
    Math.ceil(fleet.shipCount / FLEET_STRENGTH_DIVISOR),
    FLEET_STRENGTH_SEGMENTS,
  );
  const segmentColor = getFactionBarColor(fleet.faction);

  const composition = fleet.composition;

  const updateCompositionEntry = (catalogId: string, delta: number) => {
    if (!composition) return;
    let updated: FleetShipEntry[];
    const entry = composition.find((e) => e.catalogId === catalogId);
    if (!entry) return;
    const newQty = entry.quantity + delta;
    if (newQty <= 0) {
      updated = composition.filter((e) => e.catalogId !== catalogId);
    } else {
      updated = composition.map((e) =>
        e.catalogId === catalogId ? { ...e, quantity: newQty } : e,
      );
    }
    const newTotal = updated.reduce((sum, e) => sum + e.quantity, 0);
    updateFleetStats(fleet.id, { composition: updated, shipCount: Math.max(newTotal, 1) });
  };

  const addCatalogEntry = () => {
    const ship = shipCatalog.find((s) => s.id === addCatalogId);
    if (!ship) return;
    const current = composition ?? [];
    const existing = current.find((e) => e.catalogId === ship.id);
    let updated: FleetShipEntry[];
    if (existing) {
      updated = current.map((e) =>
        e.catalogId === ship.id ? { ...e, quantity: e.quantity + 1 } : e,
      );
    } else {
      updated = [
        ...current,
        {
          catalogId: ship.id,
          name: ship.name,
          shipClass: ship.shipClass,
          modelType: ship.modelType,
          quantity: 1,
        },
      ];
    }
    const newTotal = updated.reduce((sum, e) => sum + e.quantity, 0);
    updateFleetStats(fleet.id, { composition: updated, shipCount: newTotal });
    setAddMode(null);
  };

  const addCustomEntry = () => {
    if (!addCustomName.trim()) return;
    const current = composition ?? [];
    const updated = addOrIncrementCustomShipEntry(current, {
      name: addCustomName,
      shipClass: addCustomClass,
      quantityToAdd: addCustomQuantity,
    });
    const newTotal = updated.reduce((sum, e) => sum + e.quantity, 0);
    updateFleetStats(fleet.id, { composition: updated, shipCount: newTotal });
    setAddCustomName('');
    setAddCustomQuantity(CUSTOM_SHIP_QUANTITY_MIN);
    setAddMode(null);
  };

  return (
    <div className="space-y-4">
      <div className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: getFactionBarColor(fleet.faction) }}
          />
          <h2 className="text-xl font-semibold holo-heading">{fleet.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="holo-badge border"
            style={{
              backgroundColor: `${getFactionBarColor(fleet.faction)}33`,
              color: getFactionBarColor(fleet.faction),
              borderColor: `${getFactionBarColor(fleet.faction)}4D`,
            }}
          >
            {getFactionLabel(fleet.faction)}
          </span>
          {fleet.isCustom && (
            <span className="holo-badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Custom
            </span>
          )}
        </div>
      </div>

      <div className="holo-divider" />

      <div className="holo-info-grid space-y-2">
        {editable && fleet.isCustom ? (
          <>
            <EditableInfoRow
              label="Name"
              value={fleet.name}
              placeholder="Fleet Name"
              editable
              editing={nameField.editing}
              draft={nameField.draft}
              onStartEdit={() => nameField.startEdit(fleet.name)}
              onDraftChange={nameField.setDraft}
              onSave={() => {
                if (nameField.draft.trim())
                  updateFleetStats(fleet.id, { name: nameField.draft.trim() });
                nameField.stopEditing();
              }}
              onCancel={nameField.cancel}
            />
            <EditableInfoRow
              label="Commander"
              value={fleet.commander ?? ''}
              placeholder="Unknown Commander"
              editable
              editing={commanderField.editing}
              draft={commanderField.draft}
              onStartEdit={() => commanderField.startEdit(fleet.commander ?? '')}
              onDraftChange={commanderField.setDraft}
              onSave={() => {
                const trimmed = commanderField.draft.trim();
                updateFleetStats(fleet.id, { commander: trimmed || undefined });
                commanderField.stopEditing();
              }}
              onCancel={commanderField.cancel}
            />
            <EditableInfoRow
              label="Ships"
              value={`${fleet.shipCount} Vessels`}
              placeholder="10"
              editable
              editing={shipCountField.editing}
              draft={shipCountField.draft}
              onStartEdit={() => shipCountField.startEdit(String(fleet.shipCount))}
              onDraftChange={shipCountField.setDraft}
              onSave={() => {
                const parsed = parseInt(shipCountField.draft, 10);
                if (!isNaN(parsed) && parsed > 0) updateFleetStats(fleet.id, { shipCount: parsed });
                shipCountField.stopEditing();
              }}
              onCancel={shipCountField.cancel}
            />
            <div className="flex justify-between items-center text-sm">
              <span className="holo-label-inline">Faction</span>
              <select
                value={fleet.faction}
                onChange={(e) => updateFleetStats(fleet.id, { faction: e.target.value })}
                className="holo-input text-right"
                style={{ padding: '2px 6px', fontSize: '12px' }}
              >
                {allFactions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="holo-label-inline">Model</span>
              <select
                value={fleet.modelType}
                onChange={(e) =>
                  updateFleetStats(fleet.id, { modelType: e.target.value as ShipModelType })
                }
                className="holo-input text-right"
                style={{ padding: '2px 6px', fontSize: '12px' }}
              >
                {(Object.keys(MODEL_TYPE_LABELS) as ShipModelType[]).map((m) => (
                  <option key={m} value={m}>
                    {MODEL_TYPE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Ship Count" value={`${fleet.shipCount} Vessels`} />
            <InfoRow label="Faction" value={getFactionLabel(fleet.faction)} />
            <InfoRow label="Model" value={MODEL_TYPE_LABELS[fleet.modelType] ?? fleet.modelType} />
          </>
        )}
        {fleet.flagship && <InfoRow label="Flagship" value={fleet.flagship} />}
        {fleet.commander && <InfoRow label="Commander" value={fleet.commander} />}
      </div>

      {composition && composition.length > 0 && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>
            Fleet Composition
          </label>
          <div className="fleet-composition-list">
            {composition.map((entry) => (
              <CompositionEntry
                key={entry.catalogId}
                entry={entry}
                factionId={fleet.faction}
                editable={editable && !!fleet.isCustom}
                onAdd={() => updateCompositionEntry(entry.catalogId, 1)}
                onRemove={() => updateCompositionEntry(entry.catalogId, -1)}
              />
            ))}
          </div>
          {editable && fleet.isCustom && (
            <div className="fleet-composition-add-section">
              {!addMode && (
                <div className="fleet-composition-add-buttons">
                  <button
                    className="fleet-composition-add-btn"
                    onClick={() => setAddMode('catalog')}
                  >
                    + Catalog Ship
                  </button>
                  <button
                    className="fleet-composition-add-btn"
                    onClick={() => setAddMode('custom')}
                  >
                    + Custom Ship
                  </button>
                </div>
              )}
              {addMode === 'catalog' && (
                <div className="fleet-composition-add-form">
                  <select
                    value={addCatalogId}
                    onChange={(e) => setAddCatalogId(e.target.value)}
                    className="holo-input"
                    style={{ fontSize: '11px', padding: '3px 6px' }}
                  >
                    {shipCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="fleet-composition-add-form-actions">
                    <button className="fleet-composition-add-confirm" onClick={addCatalogEntry}>
                      Add
                    </button>
                    <button
                      className="fleet-composition-add-cancel"
                      onClick={() => setAddMode(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {addMode === 'custom' && (
                <div className="fleet-composition-add-form">
                  <input
                    type="text"
                    value={addCustomName}
                    onChange={(e) => setAddCustomName(e.target.value)}
                    className="holo-input"
                    placeholder="Ship name..."
                    maxLength={30}
                    style={{ fontSize: '11px', padding: '3px 6px' }}
                  />
                  <select
                    value={addCustomClass}
                    onChange={(e) => setAddCustomClass(e.target.value)}
                    className="holo-input"
                    style={{ fontSize: '11px', padding: '3px 6px' }}
                  >
                    {CUSTOM_SHIP_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <CustomShipQuantityControl
                    ariaLabel="Custom ship quantity"
                    clamp={clampCustomShipQuantity}
                    max={CUSTOM_SHIP_QUANTITY_MAX}
                    min={CUSTOM_SHIP_QUANTITY_MIN}
                    onChange={setAddCustomQuantity}
                    value={addCustomQuantity}
                  />
                  <div className="fleet-composition-add-form-actions">
                    <button
                      className="fleet-composition-add-confirm"
                      onClick={addCustomEntry}
                      disabled={!addCustomName.trim()}
                    >
                      Add
                    </button>
                    <button
                      className="fleet-composition-add-cancel"
                      onClick={() => setAddMode(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editable && viewMode === 'topdown' && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>
            Top-Down Marker Size
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={markerSize}
              onChange={(e) => updateFleetMarkerSize(fleet.id, parseFloat(e.target.value))}
              className="holo-slider flex-1"
            />
            <span
              className="holo-label-orbitron"
              style={{ color: 'var(--holo-text-primary)', width: '24px', textAlign: 'right' }}
            >
              {markerSize.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="holo-label" style={{ marginBottom: '8px' }}>
          Fleet Strength
        </label>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: FLEET_STRENGTH_SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-3 transition-all duration-300"
              style={{
                background: i < filledSegments ? segmentColor : 'rgba(200, 170, 110, 0.06)',
                border: `1px solid ${i < filledSegments ? segmentColor : 'rgba(200, 170, 110, 0.1)'}`,
                borderRadius: '3px',
                opacity: i < filledSegments ? 1 : 0.35,
              }}
            />
          ))}
        </div>
        <div
          className="text-xs mt-1 text-right holo-label-orbitron"
          style={{ color: 'var(--holo-text-muted)', fontSize: '11px' }}
        >
          {fleet.shipCount < FLEET_STRENGTH_LIGHT_THRESHOLD
            ? 'Light'
            : fleet.shipCount < FLEET_STRENGTH_HEAVY_THRESHOLD
              ? 'Medium'
              : 'Heavy'}{' '}
          Task Force
        </div>
      </div>

      {editable && fleet.isCustom && (
        <button
          onClick={() => {
            removeCustomFleet(fleet.id);
            setInfoPanelData(null);
            setSelectedFleet(null);
          }}
          className="holo-button holo-button-danger holo-button-sm w-full mt-2"
        >
          Delete Custom Fleet
        </button>
      )}
    </div>
  );
}
