import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import type { Planet, PlanetType } from '@/types';
import { PlanetDesignerModal } from '@/components/panels/PlanetDesignerModal';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import { EditableStatPill, AddFactionControl } from '@/components/panels/infoPanelShared';
import { PLANET_APPEARANCES } from '@/config/planetAppearances';
import { normalizeFactionControl } from '@/utils/factionControl';
import { useEditableField } from '@/hooks/useEditableField';
import {
  TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE,
  DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE,
} from '@/config/topDownMarkerConfig';

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const },
  }),
};

const PLANET_TYPE_COLORS: Record<string, string> = {
  terrestrial: 'text-green-400',
  gas_giant: 'text-orange-300',
  ice: 'text-blue-200',
  desert: 'text-yellow-600',
  volcanic: 'text-red-500',
  ocean: 'text-blue-400',
  jungle: 'text-green-500',
  city: 'text-gray-300',
  barren: 'text-gray-500',
  destroyed: 'text-red-400',
};

const DESCRIPTION_EXPAND_THRESHOLD = 100;

const POI_EXPAND_THRESHOLD = 6;

const SECTION_LABEL = 'holo-label tracking-widest text-white/50 text-[10px] uppercase';
const EDIT_TOGGLE_BTN =
  'text-[10px] uppercase tracking-wider text-white/30 hover:text-white/70 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100';
const SAVE_BTN_BASE =
  'px-3 py-1 text-[11px] border rounded transition-colors uppercase tracking-wider';
const CANCEL_BTN =
  'px-3 py-1 text-[11px] text-white/50 hover:text-white transition-colors uppercase tracking-wider';
const PANEL_DIVIDER = 'w-full h-[1px] bg-white/15';

interface PlanetInfoProps {
  planet: Planet;
  editable: boolean;
}

export function PlanetInfo({ planet, editable }: PlanetInfoProps) {
  const updatePlanetStats = useGalaxyDataStore((s) => s.updatePlanetStats);
  const systems = useGalaxyDataStore((s) => s.systems);
  const updateCustomSystemMarkerSize = useGalaxyDataStore((s) => s.updateCustomSystemMarkerSize);
  const removeCustomSystem = useGalaxyDataStore((s) => s.removeCustomSystem);

  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);

  const allFactions = useFactionStore((s) => s.factions);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);
  const getFactionIds = useFactionStore((s) => s.getFactionIds);

  const climate = useEditableField();
  const terrain = useEditableField();
  const inhabitants = useEditableField();
  const hyperlanes = useEditableField();
  const description = useEditableField();
  const notable = useEditableField();

  const [expandedRecord, setExpandedRecord] = useState(false);
  const [expandedPOI, setExpandedPOI] = useState(false);
  const [editingType, setEditingType] = useState(false);
  const [typeDraft, setTypeDraft] = useState(planet.customType || '');

  const [editingFaction, setEditingFaction] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);

  const factionControl = useMemo(
    () => planet.factionControl || { [planet.faction]: 100 },
    [planet.factionControl, planet.faction],
  );
  const system = systems.find((s) => s.id === planet.systemId);

  const markerSize =
    system?.markerSize ??
    (system
      ? TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE[system.importance]
      : DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE);

  const sortedFactions = useMemo(
    () =>
      (Object.entries(factionControl) as [string, number][])
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a),
    [factionControl],
  );

  const defaultPlanetColor = useMemo(
    () => (PLANET_APPEARANCES[planet.type as PlanetType] || PLANET_APPEARANCES.terrestrial).color,
    [planet.type],
  );

  const badgeColorClass = PLANET_TYPE_COLORS[planet.type] ?? 'text-gray-400';
  const badgeBorderClass = PLANET_TYPE_COLORS[planet.type]
    ? 'border-current/30'
    : 'border-white/10';

  const updateStats = useCallback(
    (patch: Parameters<typeof updatePlanetStats>[2]) => {
      updatePlanetStats(planet.systemId, planet.id, patch);
    },
    [updatePlanetStats, planet.systemId, planet.id],
  );

  const handleControlChange = useCallback(
    (faction: string, value: number) => {
      const updated = normalizeFactionControl({
        current: factionControl,
        editedFaction: faction,
        editedValue: value,
        factionOrder: getFactionIds(),
      });

      const cleaned: Partial<Record<string, number>> = {};
      for (const [f, v] of Object.entries(updated)) {
        if (v && v > 0) cleaned[f] = v;
      }

      let dominantFaction = planet.faction;
      let maxPct = 0;
      for (const [f, v] of Object.entries(cleaned) as [string, number][]) {
        if (v > maxPct) {
          maxPct = v;
          dominantFaction = f;
        }
      }

      updateStats({ factionControl: cleaned, faction: dominantFaction });
    },
    [factionControl, getFactionIds, planet.faction, updateStats],
  );

  const handleDeletePlanet = useCallback(() => {
    removeCustomSystem(planet.systemId);
    setInfoPanelData(null);
    setSelectedPlanet(null);
    setSelectedSystem(null);
  }, [removeCustomSystem, planet.systemId, setInfoPanelData, setSelectedPlanet, setSelectedSystem]);

  const parseNotable = (raw: string) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const parseHyperlanes = (raw: string) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const formatHyperlanes = (routes?: string[]) => routes?.join(', ') ?? '';

  return (
    <div className="flex flex-col">
      {/* ── 1. Header ────────────────────────────────────────────────────── */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
        <h2 className="text-3xl font-bold tracking-wide text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          {planet.name}
        </h2>
        <div
          className="w-full"
          style={{
            height: '3px',
            marginTop: '10px',
            marginBottom: '14px',
            backgroundColor: getFactionBarColor(planet.faction),
            opacity: 0.6,
          }}
        />
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {editable && editingType ? (
            <input
              type="text"
              value={typeDraft}
              onChange={(e) => setTypeDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = typeDraft.trim();
                  updateStats({ customType: trimmed || null });
                  setEditingType(false);
                }
                if (e.key === 'Escape') setEditingType(false);
              }}
              onBlur={() => setEditingType(false)}
              autoFocus
              placeholder={planet.type.replace('_', ' ')}
              className="holo-input holo-field-input text-[11px] uppercase tracking-wider font-semibold px-3 py-1 bg-white/[0.02] border-white/10 focus:border-white/20 transition-colors w-36"
            />
          ) : (
            <span
              onClick={
                editable
                  ? () => {
                      setTypeDraft(planet.customType || '');
                      setEditingType(true);
                    }
                  : undefined
              }
              className={`holo-badge border px-3 py-1 font-semibold tracking-wider text-[11px] uppercase bg-white/5 ${badgeColorClass} ${badgeBorderClass} ${editable ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''}`}
              title={editable ? 'Click to edit type' : undefined}
            >
              {planet.customType || planet.type.replace('_', ' ')}
            </span>
          )}
          <div
            className="holo-faction-territory min-w-0 max-w-full text-[12px] font-medium tracking-wide"
            style={{ color: getFactionBarColor(planet.faction) }}
          >
            <span
              className="holo-faction-dot h-2.5 w-2.5 shrink-0 shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: getFactionBarColor(planet.faction) }}
            />
            <span className="min-w-0 truncate">{getFactionLabel(planet.faction)}</span>
          </div>
        </div>
      </motion.div>

      <div className={`${PANEL_DIVIDER} my-3`} />

      {/* ── 2. Stats ──────────────────────────────────────────────────────── */}
      <motion.div
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-2"
      >
        <EditableStatPill
          label="Climate"
          value={planet.climate || ''}
          placeholder="Unknown"
          editable={editable}
          editing={climate.editing}
          draft={climate.draft}
          onStartEdit={() => climate.startEdit(planet.climate || '')}
          onDraftChange={climate.setDraft}
          onSave={() => {
            updateStats({ climate: climate.draft });
            climate.stopEditing();
          }}
          onCancel={climate.cancel}
        />
        <EditableStatPill
          label="Terrain"
          value={planet.terrain || ''}
          placeholder="Unknown"
          editable={editable}
          editing={terrain.editing}
          draft={terrain.draft}
          onStartEdit={() => terrain.startEdit(planet.terrain || '')}
          onDraftChange={terrain.setDraft}
          onSave={() => {
            updateStats({ terrain: terrain.draft });
            terrain.stopEditing();
          }}
          onCancel={terrain.cancel}
        />
        <EditableStatPill
          label="Inhabitants"
          value={planet.nativeInhabitants || ''}
          placeholder="Unknown"
          editable={editable}
          editing={inhabitants.editing}
          draft={inhabitants.draft}
          onStartEdit={() => inhabitants.startEdit(planet.nativeInhabitants || '')}
          onDraftChange={inhabitants.setDraft}
          onSave={() => {
            updateStats({ nativeInhabitants: inhabitants.draft });
            inhabitants.stopEditing();
          }}
          onCancel={inhabitants.cancel}
        />
        <EditableStatPill
          label="Hyperlanes"
          value={formatHyperlanes(planet.hyperlanes)}
          placeholder="None"
          editable={editable}
          editing={hyperlanes.editing}
          draft={hyperlanes.draft}
          onStartEdit={() => hyperlanes.startEdit(formatHyperlanes(planet.hyperlanes))}
          onDraftChange={hyperlanes.setDraft}
          onSave={() => {
            const routes = parseHyperlanes(hyperlanes.draft);
            updateStats({ hyperlanes: routes.length > 0 ? routes : null });
            hyperlanes.stopEditing();
          }}
          onCancel={hyperlanes.cancel}
        />
      </motion.div>

      {/* ── 3. Planet Color (admin-only) ─────────────────────────────────── */}
      {editable && (
        <>
          <div className={`${PANEL_DIVIDER} my-2`} />
          <div className="py-1">
            <label className={SECTION_LABEL}>Planet Color</label>
            <div className="flex items-center gap-3" style={{ marginTop: '14px' }}>
              <input
                type="color"
                value={planet.customColor || defaultPlanetColor}
                onChange={(e) => updateStats({ customColor: e.target.value })}
                className="holo-color-input"
              />
              <span className="holo-color-mode-label">
                {planet.customColor ? 'Custom' : 'Type Default'}
              </span>
              {planet.customColor && (
                <button
                  onClick={() => updateStats({ customColor: null })}
                  className="holo-inline-link"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className={`${PANEL_DIVIDER} my-2`} />
          <div className="py-1">
            <label className={SECTION_LABEL}>Surface Design</label>
            <div className="flex items-center gap-3" style={{ marginTop: '14px' }}>
              <button onClick={() => setShowDesigner(true)} className="holo-button holo-button-sm">
                <Palette className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{planet.appearance ? 'Edit Design' : 'Design Surface'}</span>
              </button>
              {planet.appearance && (
                <button
                  onClick={() => updateStats({ appearance: null })}
                  className="holo-inline-link"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showDesigner &&
        createPortal(
          <PlanetDesignerModal
            editing={{
              name: planet.name,
              faction: planet.faction,
              color: planet.customColor || defaultPlanetColor,
              type: planet.type,
              appearance: planet.appearance,
            }}
            onConfirm={(data) => {
              updateStats({ appearance: data.appearance });
              setShowDesigner(false);
            }}
            onCancel={() => setShowDesigner(false)}
          />,
          document.body,
        )}

      <div className={`${PANEL_DIVIDER} my-2`} />

      {/* ── 4. Faction Control ───────────────────────────────────────────── */}
      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="group"
        style={{ paddingTop: '4px', paddingBottom: '4px' }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
          <h3 className={SECTION_LABEL}>Faction Control</h3>
          {editable && (
            <button onClick={() => setEditingFaction(!editingFaction)} className={EDIT_TOGGLE_BTN}>
              {editingFaction ? 'Done' : 'Edit Influence'}
            </button>
          )}
        </div>

        {/* Stacked faction bars */}
        {!editingFaction ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedFactions.map(([faction, pct], barIdx) => (
              <div key={faction} className="flex items-center gap-2">
                <span className="flex min-w-0 max-w-[42%] shrink items-center gap-1.5 text-[11px] text-white/50">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: getFactionBarColor(faction),
                      boxShadow: `0 0 6px ${getFactionBarColor(faction)}`,
                    }}
                  />
                  <span className="min-w-0 truncate">{getFactionLabel(faction)}</span>
                </span>
                <div className="holo-faction-bar-track min-w-0 flex-1">
                  <motion.div
                    className="holo-faction-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      delay: 0.3 + barIdx * 0.12,
                      duration: 0.7,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    style={{
                      backgroundColor: getFactionBarColor(faction),
                      color: getFactionBarColor(faction),
                    }}
                  />
                </div>
                <span
                  className="w-[36px] shrink-0 text-right text-[12px] font-semibold"
                  style={{ color: getFactionBarColor(faction) }}
                >
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {allFactions.map((f) => {
              const pct = factionControl[f.id] || 0;
              if (pct === 0 && f.id !== planet.faction) return null;

              return (
                <div key={f.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]"
                        style={{
                          backgroundColor: getFactionBarColor(f.id),
                          color: getFactionBarColor(f.id),
                        }}
                      />
                      <span className="text-white/80">{getFactionLabel(f.id)}</span>
                    </span>
                    <span className="font-bold" style={{ color: getFactionBarColor(f.id) }}>
                      {pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={pct}
                    onChange={(e) => handleControlChange(f.id, parseInt(e.target.value))}
                    className="holo-slider w-full"
                    style={{ accentColor: getFactionBarColor(f.id) }}
                  />
                </div>
              );
            })}

            {allFactions.filter((f) => !factionControl[f.id]).length > 0 && (
              <div className="pt-2">
                <AddFactionControl
                  existingFactions={Object.keys(factionControl)}
                  onAdd={(faction) => handleControlChange(faction, 10)}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>

      <div className={`${PANEL_DIVIDER} my-2`} />

      {/* ── 5. Planetary Record ──────────────────────────────────────────── */}
      <motion.div
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="group"
        style={{ paddingTop: '4px', paddingBottom: '4px' }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
          <h3 className={SECTION_LABEL}>Planetary Record</h3>
        </div>

        {editable && description.editing ? (
          <div className="holo-recessed-card">
            <textarea
              value={description.draft}
              onChange={(e) => description.setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  updateStats({ description: description.draft });
                  description.stopEditing();
                }
                if (e.key === 'Escape') description.cancel();
              }}
              autoFocus
              rows={4}
              className="holo-input holo-field-textarea w-full text-[13px] leading-relaxed p-0 bg-transparent border-none focus:border-none focus:ring-0"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            <div className="flex gap-2 justify-end" style={{ marginTop: '10px' }}>
              <button onClick={description.cancel} className={CANCEL_BTN}>
                Cancel
              </button>
              <button
                onClick={() => {
                  updateStats({ description: description.draft });
                  description.stopEditing();
                }}
                className={`${SAVE_BTN_BASE} bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="holo-recessed-card">
            <div
              onClick={editable ? () => description.startEdit(planet.description || '') : undefined}
              className={`text-[13px] leading-relaxed text-white/70 ${
                !expandedRecord ? 'line-clamp-3' : 'overflow-y-auto'
              } ${editable ? 'cursor-text hover:text-white/90 transition-colors' : ''}`}
              style={expandedRecord ? { maxHeight: '200px' } : undefined}
              title={editable ? 'Click to edit' : undefined}
            >
              {planet.description || (
                <span className="text-white/25 italic">No planetary records on file.</span>
              )}
            </div>

            {planet.description && planet.description.length > DESCRIPTION_EXPAND_THRESHOLD && (
              <button
                onClick={() => setExpandedRecord(!expandedRecord)}
                className="text-[10px] text-amber-500/70 hover:text-amber-400 uppercase tracking-widest transition-colors"
                style={{ marginTop: '8px' }}
              >
                {expandedRecord ? 'Collapse' : 'Read Full Record'}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ── 6. Top-Down Marker Size (admin + topdown only) ───────────────── */}
      {editable && viewMode === 'topdown' && (
        <div>
          <label className={`${SECTION_LABEL} mb-4 block`}>Top-Down Marker Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={markerSize}
              onChange={(e) =>
                updateCustomSystemMarkerSize(planet.systemId, parseFloat(e.target.value))
              }
              className="holo-slider flex-1"
            />
            <span className="holo-marker-value">{markerSize.toFixed(1)}</span>
          </div>
        </div>
      )}

      <div className={`${PANEL_DIVIDER} my-3`} />

      {/* ── 7. Points of Interest ────────────────────────────────────────── */}
      <motion.div
        custom={5}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="group"
        style={{ paddingTop: '8px', paddingBottom: '8px' }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
          <h3 className={SECTION_LABEL}>Points of Interest</h3>
        </div>

        {editable && notable.editing ? (
          <div className="mt-1">
            <input
              type="text"
              value={notable.draft}
              onChange={(e) => notable.setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateStats({ notable: parseNotable(notable.draft) });
                  notable.stopEditing();
                }
                if (e.key === 'Escape') notable.cancel();
              }}
              autoFocus
              placeholder="Coordinates / Locations (comma separated)"
              className="holo-input holo-field-input w-full text-[13px] p-2 bg-white/[0.02] border-white/5 focus:border-white/20 transition-colors"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={notable.cancel} className={CANCEL_BTN}>
                Cancel
              </button>
              <button
                onClick={() => {
                  updateStats({ notable: parseNotable(notable.draft) });
                  notable.stopEditing();
                }}
                className={`${SAVE_BTN_BASE} bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border-cyan-500/20`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              onClick={
                editable ? () => notable.startEdit((planet.notable || []).join(', ')) : undefined
              }
              className={`min-h-[1.5rem] ${editable ? 'cursor-text' : ''}`}
              title={editable ? 'Click to edit' : undefined}
            >
              {planet.notable && planet.notable.length > 0 ? (
                <div
                  className={`flex flex-col gap-1 ${!expandedPOI ? 'max-h-[120px] overflow-hidden' : ''}`}
                >
                  {planet.notable.map((loc, i) => (
                    <div key={i} className="holo-poi-item">
                      <span className="holo-poi-index">{String(i + 1).padStart(2, '0')}</span>
                      <span className="holo-poi-name">{loc}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-white/25 italic text-[13px]">
                  {editable ? 'Click to register locations...' : 'No surface data available.'}
                </span>
              )}
            </div>

            {planet.notable && planet.notable.length > POI_EXPAND_THRESHOLD && (
              <button
                onClick={() => setExpandedPOI(!expandedPOI)}
                className="text-[10px] text-cyan-500/70 hover:text-cyan-400 uppercase tracking-widest mt-2 transition-colors"
              >
                {expandedPOI ? 'Show Less' : `View All ${planet.notable.length} Locations`}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ── 8. Alerts ────────────────────────────────────────────────────── */}
      {planet.type === 'destroyed' && (
        <div className="holo-info-grid holo-info-grid-danger mt-4">
          <div className="holo-alert-row holo-alert-danger">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>WARNING: PLANETARY DESTRUCTION</span>
          </div>
        </div>
      )}

      {planet.type === 'volcanic' && (
        <div className="holo-info-grid holo-info-grid-warning mt-4">
          <div className="holo-alert-row holo-alert-warning">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
            <span>EXTREME VOLCANIC ACTIVITY</span>
          </div>
        </div>
      )}

      {/* ── 9. Danger Zone (admin + custom only) ─────────────────────────── */}
      {editable && system?.isCustom && (
        <div className="mt-12 pt-8 pb-4 text-center opacity-30 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleDeletePlanet}
            className="text-[10px] text-red-500 hover:text-red-400 uppercase tracking-widest font-semibold"
          >
            Delete Custom Planet
          </button>
        </div>
      )}
    </div>
  );
}
