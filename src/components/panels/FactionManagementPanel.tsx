import { useState } from 'react';
import { ChevronDown, ChevronRight, Flag, Plus } from 'lucide-react';
import { useFactionStore } from '@/store/factionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import type { FactionConfig } from '@/types';

function generateFactionId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slug}_${rand}`;
}

function FactionRow({
  faction,
  onEdit,
  onDelete,
}: {
  faction: FactionConfig;
  onEdit: (f: FactionConfig) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 min-h-[52px] px-3.5"
      style={{
        background:
          'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, transparent 60%), rgba(200, 170, 110, 0.04)',
        border: '1px solid rgba(200, 170, 110, 0.1)',
        borderRadius: '12px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
      }}
    >
      <span
        className="flex-1 font-medium leading-tight truncate"
        style={{ color: faction.barColor, paddingLeft: '1rem', fontSize: '18px' }}
      >
        {faction.label}
      </span>
      <div className="flex items-center gap-3 mr-6">
        <button
          onClick={() => onEdit(faction)}
          className="text-[13px] uppercase tracking-wide holo-label-orbitron px-1.5 py-1.5 leading-none hover:underline"
          style={{ color: 'var(--holo-cyan)' }}
        >
          Edit
        </button>
        {!faction.isBuiltin && (
          <button
            onClick={() => onDelete(faction.id)}
            className="text-[13px] uppercase tracking-wide holo-label-orbitron px-1.5 py-1.5 leading-none hover:underline"
            style={{ color: '#DC143C' }}
          >
            Del
          </button>
        )}
      </div>
    </div>
  );
}

function FactionEditForm({
  faction,
  onSave,
  onCancel,
}: {
  faction: FactionConfig;
  onSave: (updates: Partial<Pick<FactionConfig, 'label' | 'markerColor' | 'barColor'>>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(faction.label);
  const [markerColor, setMarkerColor] = useState(faction.markerColor);
  const [barColor, setBarColor] = useState(faction.barColor);

  return (
    <div
      className="space-y-3 p-4"
      style={{
        background:
          'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, transparent 60%), rgba(0, 240, 255, 0.05)',
        border: '1px solid rgba(0, 240, 255, 0.2)',
        borderRadius: '12px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
      }}
    >
      <div className="text-[10px] uppercase tracking-wide holo-label-orbitron" style={{ color: 'var(--holo-cyan)' }}>
        Editing: {faction.label}
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="holo-input w-full text-[14px]"
        style={{ padding: '7px 10px' }}
        placeholder="Faction name"
        maxLength={30}
      />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Marker</span>
          <input
            type="color"
            value={markerColor}
            onChange={(e) => setMarkerColor(e.target.value)}
            className="w-7 h-7 border cursor-pointer bg-transparent"
            style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Accent</span>
          <input
            type="color"
            value={barColor}
            onChange={(e) => setBarColor(e.target.value)}
            className="w-7 h-7 border cursor-pointer bg-transparent"
            style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const updates: Partial<Pick<FactionConfig, 'label' | 'markerColor' | 'barColor'>> = {};
            if (label.trim() && label !== faction.label) updates.label = label.trim();
            if (markerColor !== faction.markerColor) updates.markerColor = markerColor;
            if (barColor !== faction.barColor) updates.barColor = barColor;
            if (Object.keys(updates).length > 0) onSave(updates);
            else onCancel();
          }}
          className="text-[11px] uppercase tracking-wide holo-label-orbitron px-1.5 py-0.5"
          style={{ color: 'var(--holo-cyan)' }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-[11px] uppercase tracking-wide holo-label-orbitron px-1.5 py-0.5"
          style={{ color: 'var(--holo-text-muted)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function FactionManagementPanel({ isFloatingMode = false }: { isFloatingMode?: boolean }) {
  const factions = useFactionStore((s) => s.factions);
  const createFaction = useFactionStore((s) => s.createFaction);
  const updateFaction = useFactionStore((s) => s.updateFaction);
  const removeFaction = useFactionStore((s) => s.removeFaction);
  const syncFactionFilters = useGalaxyUIStore((s) => s.syncFactionFilters);
  const getFactionIds = useFactionStore((s) => s.getFactionIds);
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);
  const updatePlanetStats = useGalaxyDataStore((s) => s.updatePlanetStats);
  const updateFleetStats = useGalaxyDataStore((s) => s.updateFleetStats);

  const [collapsed, setCollapsed] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMarkerColor, setNewMarkerColor] = useState('#4DD0E1');
  const [newBarColor, setNewBarColor] = useState('#4DD0E1');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const editingFaction = editingId ? factions.find((f) => f.id === editingId) : null;

  const getAffectedCount = (factionId: string) => {
    let planets = 0;
    let fleetCount = 0;
    for (const system of systems) {
      for (const planet of system.planets) {
        if (planet.faction === factionId) planets++;
      }
    }
    for (const fleet of fleets) {
      if (fleet.faction === factionId) fleetCount++;
    }
    return { planets, fleets: fleetCount };
  };

  const handleDelete = async (id: string) => {
    const success = await removeFaction(id);
    if (!success) return;
    for (const system of systems) {
      for (const planet of system.planets) {
        if (planet.faction === id) {
          updatePlanetStats(system.id, planet.id, { faction: 'neutral' });
        }
      }
    }
    for (const fleet of fleets) {
      if (fleet.faction === id) {
        updateFleetStats(fleet.id, { faction: 'neutral' });
      }
    }
    syncFactionFilters(getFactionIds());
    setDeleteConfirmId(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = generateFactionId(newName.trim());
    await createFaction({ id, label: newName.trim(), markerColor: newMarkerColor, barColor: newBarColor });
    syncFactionFilters(useFactionStore.getState().getFactionIds());
    setNewName('');
    setNewMarkerColor('#4DD0E1');
    setNewBarColor('#4DD0E1');
    setShowCreate(false);
  };

  return (
    <div className={isFloatingMode ? "" : "holo-panel"} style={isFloatingMode ? {} : { marginTop: '0' }}>
      {!isFloatingMode && (
        <label
          className="holo-label holo-section-header"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="flex items-center gap-2">
            <Flag className="w-4 h-4" style={{ opacity: 0.7 }} aria-hidden="true" />
            Factions
          </span>
          <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>
            {collapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </span>
        </label>
      )}

      {(isFloatingMode || !collapsed) && (
        <div className="space-y-4 mt-4">
          <div
            className="space-y-3 p-3.5"
            style={{
              background: 'rgba(0, 0, 0, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '14px',
              boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.25)',
            }}
          >
            {factions.map((f) =>
              editingId === f.id && editingFaction ? (
                <FactionEditForm
                  key={f.id}
                  faction={editingFaction}
                  onSave={(updates) => {
                    updateFaction(f.id, updates);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : deleteConfirmId === f.id ? (
                <div
                  key={f.id}
                  className="p-4 space-y-3"
                  style={{
                    background:
                      'linear-gradient(160deg, rgba(255, 255, 255, 0.04) 0%, transparent 60%), rgba(220, 20, 60, 0.07)',
                    border: '1px solid rgba(220, 20, 60, 0.25)',
                    borderRadius: '12px',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="text-[11px] holo-label-orbitron" style={{ color: '#DC143C' }}>
                    Delete "{f.label}"?
                  </div>
                  {(() => {
                    const affected = getAffectedCount(f.id);
                    return (affected.planets > 0 || affected.fleets > 0) ? (
                      <div className="text-[11px] holo-body-text" style={{ color: 'var(--holo-text-muted)' }}>
                        {affected.planets} planet{affected.planets !== 1 ? 's' : ''} and {affected.fleets} fleet{affected.fleets !== 1 ? 's' : ''} will be reassigned to Neutral.
                      </div>
                    ) : null;
                  })()}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="text-[11px] uppercase tracking-wide holo-label-orbitron px-1.5 py-0.5"
                      style={{ color: '#DC143C' }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-[11px] uppercase tracking-wide holo-label-orbitron px-1.5 py-0.5"
                      style={{ color: 'var(--holo-text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <FactionRow
                  key={f.id}
                  faction={f}
                  onEdit={(faction) => setEditingId(faction.id)}
                  onDelete={(id) => setDeleteConfirmId(id)}
                />
              ),
            )}
          </div>

          <div style={{ marginTop: '21px' }}>
            {showCreate ? (
              <div
                className="space-y-3 p-4"
                style={{
                  background:
                    'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, transparent 60%), rgba(0, 240, 255, 0.05)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
                }}
              >
                <div className="text-[10px] uppercase tracking-wide holo-label-orbitron" style={{ color: 'var(--holo-cyan)' }}>
                  New Faction
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="holo-input w-full text-[14px]"
                  style={{ padding: '7px 10px' }}
                  placeholder="Faction name"
                  maxLength={30}
                  autoFocus
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Marker</span>
                    <input
                      type="color"
                      value={newMarkerColor}
                      onChange={(e) => setNewMarkerColor(e.target.value)}
                      className="w-7 h-7 border cursor-pointer bg-transparent"
                      style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Accent</span>
                    <input
                      type="color"
                      value={newBarColor}
                      onChange={(e) => setNewBarColor(e.target.value)}
                      className="w-7 h-7 border cursor-pointer bg-transparent"
                      style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="text-[11px] uppercase tracking-wide holo-label-orbitron px-1.5 py-0.5 disabled:opacity-30"
                    style={{ color: 'var(--holo-cyan)' }}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setNewName(''); }}
                    className="text-[11px] uppercase tracking-wide holo-label-orbitron px-1.5 py-0.5"
                    style={{ color: 'var(--holo-text-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="holo-button w-full"
              >
                <Plus className="w-4 h-4 flex-shrink-0" style={{ transform: 'translateY(-1px)' }} aria-hidden="true" />
                <span className="leading-none">Create Faction</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
