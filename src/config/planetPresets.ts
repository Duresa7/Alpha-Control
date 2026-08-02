import type { PlanetAppearance, PlanetSurfaceStyle, PlanetType } from '@/types';

export interface PlanetPreset {
  id: string;
  label: string;
  description: string;
  planetType: PlanetType;
  appearance: PlanetAppearance;
}

const BASE: PlanetAppearance = {
  renderStyle: 'procedural',
  surface: 'landmass',
  seed: 1337,
  colorLow: '#123a52',
  colorMid: '#4A7C59',
  colorHigh: '#8B7355',
  waterLevel: 0.45,
  iceCaps: 0.9,
  clouds: 0.55,
  cloudColor: '#F2F6FA',
  atmosphere: 0.7,
  atmosphereColor: '#87CEEB',
  nightLights: 0,
  nightLightColor: '#FFCC66',
  rings: 0,
  ringColor: '#E2C9A0',
  roughness: 0.8,
};

export const PLANET_PRESETS: PlanetPreset[] = [
  {
    id: 'terran',
    label: 'Terran',
    description: 'Continents, shallow seas, polar caps',
    planetType: 'terrestrial',
    appearance: { ...BASE },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Deep water with scattered archipelagos',
    planetType: 'ocean',
    appearance: {
      ...BASE,
      colorLow: '#0d3350',
      colorMid: '#2E8B57',
      colorHigh: '#7fc39a',
      waterLevel: 0.68,
      iceCaps: 0.55,
      clouds: 0.65,
      roughness: 0.25,
    },
  },
  {
    id: 'jungle',
    label: 'Jungle',
    description: 'Dense canopy, heavy weather',
    planetType: 'jungle',
    appearance: {
      ...BASE,
      colorLow: '#0d3a2a',
      colorMid: '#228B22',
      colorHigh: '#9fd66a',
      waterLevel: 0.34,
      iceCaps: 0.2,
      clouds: 0.72,
      atmosphereColor: '#90EE90',
      roughness: 0.85,
    },
  },
  {
    id: 'desert',
    label: 'Desert',
    description: 'Wind-carved dune belts, no surface water',
    planetType: 'desert',
    appearance: {
      ...BASE,
      surface: 'dunes',
      colorLow: '#7d5738',
      colorMid: '#C2956E',
      colorHigh: '#f0dcbb',
      waterLevel: 0,
      iceCaps: 0,
      clouds: 0.1,
      atmosphere: 0.45,
      atmosphereColor: '#E8C9A0',
      roughness: 0.9,
    },
  },
  {
    id: 'ice',
    label: 'Ice',
    description: 'Frozen shell split by pressure fractures',
    planetType: 'ice',
    appearance: {
      ...BASE,
      surface: 'icy',
      colorLow: '#6d95b4',
      colorMid: '#A8D8EA',
      colorHigh: '#ffffff',
      waterLevel: 0,
      iceCaps: 0.35,
      clouds: 0.4,
      atmosphere: 0.6,
      atmosphereColor: '#CCE5FF',
      roughness: 0.3,
    },
  },
  {
    id: 'volcanic',
    label: 'Volcanic',
    description: 'Cooled crust over active lava channels',
    planetType: 'volcanic',
    appearance: {
      ...BASE,
      surface: 'ridged',
      colorLow: '#1c1414',
      colorMid: '#4A3030',
      colorHigh: '#8B0000',
      waterLevel: 0,
      iceCaps: 0,
      clouds: 0.25,
      cloudColor: '#6E5A52',
      atmosphere: 0.5,
      atmosphereColor: '#8A3A24',
      nightLights: 1,
      nightLightColor: '#FF6A1E',
      roughness: 0.7,
    },
  },
  {
    id: 'ecumenopolis',
    label: 'Ecumenopolis',
    description: 'City-covered world, lit across the night side',
    planetType: 'city',
    appearance: {
      ...BASE,
      surface: 'urban',
      colorLow: '#26262f',
      colorMid: '#505060',
      colorHigh: '#767688',
      waterLevel: 0,
      iceCaps: 0,
      clouds: 0.22,
      atmosphere: 0.55,
      atmosphereColor: '#9AA8C4',
      nightLights: 1,
      nightLightColor: '#FFCC66',
      roughness: 0.4,
    },
  },
  {
    id: 'gas_giant',
    label: 'Gas giant',
    description: 'Banded envelope with a ring system',
    planetType: 'gas_giant',
    appearance: {
      ...BASE,
      surface: 'bands',
      colorLow: '#6b4f10',
      colorMid: '#b8914f',
      colorHigh: '#f5e3c6',
      waterLevel: 0,
      iceCaps: 0,
      clouds: 0,
      atmosphere: 0.8,
      atmosphereColor: '#E0C090',
      rings: 0.9,
      ringColor: '#E2C9A0',
      roughness: 0.9,
    },
  },
  {
    id: 'barren',
    label: 'Barren',
    description: 'Airless rock, heavily cratered',
    planetType: 'barren',
    appearance: {
      ...BASE,
      surface: 'cratered',
      colorLow: '#4a4a4a',
      colorMid: '#696969',
      colorHigh: '#9a9a9a',
      waterLevel: 0,
      iceCaps: 0,
      clouds: 0,
      atmosphere: 0.12,
      atmosphereColor: '#8890A0',
      roughness: 1,
    },
  },
  {
    id: 'dead',
    label: 'Dead world',
    description: 'Scorched remains still venting heat',
    planetType: 'destroyed',
    appearance: {
      ...BASE,
      surface: 'cratered',
      colorLow: '#141414',
      colorMid: '#2c2c2c',
      colorHigh: '#5a4a44',
      waterLevel: 0,
      iceCaps: 0,
      clouds: 0.15,
      cloudColor: '#5A5048',
      atmosphere: 0.2,
      atmosphereColor: '#7A4030',
      nightLights: 0.45,
      nightLightColor: '#FF3A1E',
      roughness: 0.9,
    },
  },
  {
    id: 'holo',
    label: 'Holo schematic',
    description: 'Tactical wireframe readout, not a rendered world',
    planetType: 'terrestrial',
    appearance: {
      ...BASE,
      renderStyle: 'holo',
      clouds: 0,
      rings: 0,
      atmosphere: 0.8,
      atmosphereColor: '#C8AA6E',
    },
  },
];

export const DEFAULT_PLANET_APPEARANCE = PLANET_PRESETS[0].appearance;

/** Opening the designer on an existing planet starts from the closest template. */
export function presetForPlanetType(type: PlanetType): PlanetPreset {
  return PLANET_PRESETS.find((preset) => preset.planetType === type) ?? PLANET_PRESETS[0];
}

export const SURFACE_STYLE_OPTIONS: { value: PlanetSurfaceStyle; label: string }[] = [
  { value: 'landmass', label: 'Continents' },
  { value: 'dunes', label: 'Dunes' },
  { value: 'icy', label: 'Ice sheet' },
  { value: 'ridged', label: 'Lava ridges' },
  { value: 'urban', label: 'Urban sprawl' },
  { value: 'bands', label: 'Gas bands' },
  { value: 'cratered', label: 'Craters' },
];

/** Single source of truth for validating a surface style read back from the database. */
export const PLANET_SURFACE_STYLES: PlanetSurfaceStyle[] = SURFACE_STYLE_OPTIONS.map(
  (option) => option.value,
);
