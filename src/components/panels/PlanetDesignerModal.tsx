import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Dices, Globe, X } from 'lucide-react';
import type { Faction, PendingCustomPlanet, PlanetAppearance, PlanetType } from '@/types';
import { useFactionStore } from '@/store/factionStore';
import { ProceduralPlanet } from '@/components/three/ProceduralPlanet';
import {
  PLANET_PRESETS,
  SURFACE_STYLE_OPTIONS,
  DEFAULT_PLANET_APPEARANCE,
  presetForPlanetType,
} from '@/config/planetPresets';

export interface PlanetDesignerTarget {
  name: string;
  faction: Faction;
  color: string;
  type: PlanetType;
  appearance?: PlanetAppearance;
}

interface PlanetDesignerModalProps {
  /**
   * An already-placed planet being restyled. Identity is edited from the info
   * panel, so those fields are hidden and only the appearance is returned.
   */
  editing?: PlanetDesignerTarget;
  onConfirm: (data: PendingCustomPlanet) => void;
  onCancel: () => void;
}

interface SliderRowProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

function SliderRow({ label, value, min = 0, max = 1, onChange }: SliderRowProps) {
  return (
    <label className="planet-designer-slider">
      <span className="planet-designer-slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="planet-designer-range"
      />
      <span className="planet-designer-slider-value">{Math.round((value / max) * 100)}%</span>
    </label>
  );
}

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <label className="planet-designer-color">
      <span className="planet-designer-slider-label">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="holo-color-input"
      />
    </label>
  );
}

export function PlanetDesignerModal({ editing, onConfirm, onCancel }: PlanetDesignerModalProps) {
  const allFactions = useFactionStore((s) => s.factions);

  const [name, setName] = useState(editing?.name ?? '');
  const [faction, setFaction] = useState(() => editing?.faction ?? allFactions[0]?.id ?? 'neutral');
  const [markerColor, setMarkerColor] = useState(editing?.color ?? '#4DD0E1');
  const [planetType, setPlanetType] = useState<PlanetType>(
    editing?.type ?? PLANET_PRESETS[0].planetType,
  );
  const [appearance, setAppearance] = useState<PlanetAppearance>(() => {
    if (editing?.appearance) return { ...editing.appearance };
    // Never styled before: start from the template closest to what it already is.
    if (editing) return { ...presetForPlanetType(editing.type).appearance };
    return { ...DEFAULT_PLANET_APPEARANCE };
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    if (editing?.appearance) return null;
    if (editing) return presetForPlanetType(editing.type).id;
    return PLANET_PRESETS[0].id;
  });

  const setField = <K extends keyof PlanetAppearance>(key: K, value: PlanetAppearance[K]) => {
    setAppearance((prev) => ({ ...prev, [key]: value }));
    setActivePresetId(null);
  };

  const applyPreset = (presetId: string) => {
    const preset = PLANET_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setAppearance({ ...preset.appearance, seed: appearance.seed });
    setPlanetType(preset.planetType);
    setActivePresetId(preset.id);
  };

  const rerollSeed = () => {
    setAppearance((prev) => ({ ...prev, seed: Math.floor(Math.random() * 100000) }));
  };

  const isHolo = appearance.renderStyle === 'holo';

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm({
      name: name.trim(),
      color: markerColor,
      faction,
      type: planetType,
      appearance,
    });
  };

  return (
    <div className="fleet-modal-overlay" onClick={onCancel}>
      <div className="fleet-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="fleet-modal-header">
          <div className="fleet-modal-header-left">
            <Globe className="fleet-modal-header-icon" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="fleet-modal-title">
              {editing ? `Planetary Design · ${editing.name}` : 'Planetary Design Interface'}
            </h2>
          </div>
          <button className="fleet-modal-close holo-close-button" onClick={onCancel}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="fleet-modal-body planet-designer-body">
          <div className="planet-designer-stage">
            <div className="planet-designer-viewport">
              <Canvas camera={{ position: [0, 0.7, 3.6], fov: 34 }} gl={{ alpha: true }}>
                <ProceduralPlanet appearance={appearance} />
                <OrbitControls enablePan={false} minDistance={2.4} maxDistance={6} />
              </Canvas>
              <span className="planet-designer-seed">
                SEED {String(appearance.seed).padStart(5, '0')}
              </span>
              <button
                className="planet-designer-reroll"
                onClick={rerollSeed}
                title="Generate a different world with the same settings"
              >
                <Dices size={13} aria-hidden="true" />
                <span>Reroll</span>
              </button>
            </div>

            <div className="planet-designer-presets">
              <span className="fleet-config-label">Templates</span>
              <div className="planet-designer-preset-grid">
                {PLANET_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className={`planet-designer-preset${
                      activePresetId === preset.id ? ' is-active' : ''
                    }`}
                    onClick={() => applyPreset(preset.id)}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="fleet-modal-config planet-designer-config">
            {!editing && (
              <>
                <div className="fleet-config-section">
                  <label className="fleet-config-label">Designation</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="holo-input fleet-config-input"
                    placeholder="Enter planet name..."
                    maxLength={30}
                    autoFocus
                  />
                </div>

                <div className="fleet-config-section">
                  <label className="fleet-config-label">Allegiance</label>
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
              </>
            )}

            <div className="fleet-config-section">
              <label className="fleet-config-label">Render Style</label>
              <div className="planet-designer-toggle">
                <button
                  className={!isHolo ? 'is-active' : ''}
                  onClick={() => setField('renderStyle', 'procedural')}
                >
                  Rendered
                </button>
                <button
                  className={isHolo ? 'is-active' : ''}
                  onClick={() => setField('renderStyle', 'holo')}
                >
                  Schematic
                </button>
              </div>
            </div>

            <div className="planet-designer-section">
              <span className="planet-designer-section-title">Surface</span>
              <select
                value={appearance.surface}
                onChange={(e) => setField('surface', e.target.value as PlanetAppearance['surface'])}
                className="holo-input fleet-config-select"
              >
                {SURFACE_STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ColorRow
                label="Low"
                value={appearance.colorLow}
                onChange={(v) => setField('colorLow', v)}
              />
              <ColorRow
                label="Mid"
                value={appearance.colorMid}
                onChange={(v) => setField('colorMid', v)}
              />
              <ColorRow
                label="High"
                value={appearance.colorHigh}
                onChange={(v) => setField('colorHigh', v)}
              />
              <SliderRow
                label="Water"
                value={appearance.waterLevel}
                max={0.9}
                onChange={(v) => setField('waterLevel', v)}
              />
              <SliderRow
                label="Ice caps"
                value={appearance.iceCaps}
                onChange={(v) => setField('iceCaps', v)}
              />
              <SliderRow
                label="Gloss"
                value={1 - appearance.roughness}
                onChange={(v) => setField('roughness', 1 - v)}
              />
            </div>

            <div className="planet-designer-section">
              <span className="planet-designer-section-title">Atmosphere</span>
              <SliderRow
                label="Glow"
                value={appearance.atmosphere}
                max={1.5}
                onChange={(v) => setField('atmosphere', v)}
              />
              <ColorRow
                label="Glow tint"
                value={appearance.atmosphereColor}
                onChange={(v) => setField('atmosphereColor', v)}
              />
              <SliderRow
                label="Cloud cover"
                value={appearance.clouds}
                onChange={(v) => setField('clouds', v)}
              />
              <ColorRow
                label="Cloud tint"
                value={appearance.cloudColor}
                onChange={(v) => setField('cloudColor', v)}
              />
            </div>

            <div className="planet-designer-section">
              <span className="planet-designer-section-title">Features</span>
              <SliderRow
                label="Night lights"
                value={appearance.nightLights}
                onChange={(v) => setField('nightLights', v)}
              />
              <ColorRow
                label="Light tint"
                value={appearance.nightLightColor}
                onChange={(v) => setField('nightLightColor', v)}
              />
              <SliderRow
                label="Rings"
                value={appearance.rings}
                onChange={(v) => setField('rings', v)}
              />
              <ColorRow
                label="Ring tint"
                value={appearance.ringColor}
                onChange={(v) => setField('ringColor', v)}
              />
            </div>

            {!editing && (
              <div className="planet-designer-section">
                <span className="planet-designer-section-title">Map Marker</span>
                <ColorRow label="Marker colour" value={markerColor} onChange={setMarkerColor} />
              </div>
            )}

            <div className="fleet-modal-actions">
              <button
                className="holo-button fleet-confirm-btn"
                onClick={handleConfirm}
                disabled={!name.trim()}
              >
                {editing ? 'Save Appearance' : 'Place on Map'}
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
