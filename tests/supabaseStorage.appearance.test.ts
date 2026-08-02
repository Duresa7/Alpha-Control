import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlanetAppearance, StarSystem } from '../src/types';

const mocks = vi.hoisted(() => {
  const state = { selectData: [] as unknown[] };
  return {
    state,
    from: vi.fn(() => ({
      select: vi.fn(async () => ({ data: state.selectData, error: null })),
      upsert: vi.fn(async () => ({ error: null })),
    })),
    authGetUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    from: mocks.from,
    auth: { getUser: mocks.authGetUser },
  },
}));

import { batchUpsertSystems, loadCustomSystems } from '../src/data/supabaseStorage';

/** Mirrors the key set present on the live rows before appearance existed. */
const legacyRow = () => ({
  id: 'legacy-system',
  name: 'Legacy System',
  position_x: 12.5,
  position_y: 0,
  position_z: -33.25,
  custom_color: '#6f4306',
  marker_size: 1.1,
  planets: [
    {
      id: 'legacy-system-prime',
      name: 'Legacy Prime',
      type: 'ice',
      radius: 1,
      faction: 'neutral',
      description: 'A world that existed before the designer shipped.',
      terrain: 'Glaciers',
      climate: 'Frozen',
      hyperlanes: ['Hydian Way'],
      nativeInhabitants: 'None',
      customColor: '#88ccff',
      factionControl: { neutral: 100 },
    },
  ],
  created_by: null,
});

const appearance: PlanetAppearance = {
  renderStyle: 'procedural',
  surface: 'icy',
  seed: 4242,
  colorLow: '#6d95b4',
  colorMid: '#a8d8ea',
  colorHigh: '#ffffff',
  waterLevel: 0,
  iceCaps: 0.35,
  clouds: 0.4,
  cloudColor: '#f2f6fa',
  atmosphere: 0.6,
  atmosphereColor: '#cce5ff',
  nightLights: 0,
  nightLightColor: '#ffcc66',
  rings: 0,
  ringColor: '#e2c9a0',
  roughness: 0.3,
};

const buildSystem = (id: string, planetAppearance?: PlanetAppearance): StarSystem => ({
  id,
  name: id,
  position: new THREE.Vector3(12.5, 0, -33.25),
  faction: 'neutral',
  starType: 'white',
  importance: 'minor',
  description: `${id} description`,
  region: 'unknown_regions',
  isCustom: true,
  planets: [
    {
      id: `${id}-prime`,
      name: `${id} Prime`,
      type: 'ice',
      position: new THREE.Vector3(0, 0, 0),
      radius: 1,
      faction: 'neutral',
      description: `${id} Prime description`,
      systemId: id,
      appearance: planetAppearance,
    },
  ],
});

const getLatestUpsert = () => {
  const latest = mocks.from.mock.results[mocks.from.mock.results.length - 1];
  return (latest?.value as { upsert: ReturnType<typeof vi.fn> }).upsert;
};

describe('planet appearance persistence', () => {
  beforeEach(() => {
    mocks.from.mockClear();
    mocks.state.selectData = [];
  });

  it('leaves pre-existing planets untouched when they carry no appearance', async () => {
    mocks.state.selectData = [legacyRow()];

    const systems = await loadCustomSystems();
    const planet = systems[0].planets[0];

    expect(planet.appearance).toBeUndefined();
    // Position and identity must survive exactly as stored.
    expect(systems[0].position.x).toBe(12.5);
    expect(systems[0].position.z).toBe(-33.25);
    expect(systems[0].customColor).toBe('#6f4306');
    expect(systems[0].markerSize).toBe(1.1);
    expect(planet.customColor).toBe('#88ccff');
    expect(planet.type).toBe('ice');
    expect(planet.hyperlanes).toEqual(['Hydian Way']);
  });

  it('does not add an appearance key when saving an unstyled planet', async () => {
    await batchUpsertSystems([buildSystem('unstyled')], 'user-1');

    const [rows] = getLatestUpsert().mock.calls[0];
    expect('appearance' in rows[0].planets[0]).toBe(false);
  });

  it('round-trips a designed appearance through save and load', async () => {
    await batchUpsertSystems([buildSystem('styled', appearance)], 'user-1');

    const [rows] = getLatestUpsert().mock.calls[0];
    expect(rows[0].planets[0].appearance).toEqual(appearance);

    mocks.state.selectData = [
      { ...legacyRow(), id: 'styled', planets: [{ ...legacyRow().planets[0], appearance }] },
    ];
    const systems = await loadCustomSystems();
    expect(systems[0].planets[0].appearance).toEqual(appearance);
  });

  it('falls back to the plain sphere when stored appearance is malformed', async () => {
    const cases: unknown[] = [
      null,
      'not-an-object',
      [],
      {},
      { surface: 'not-a-real-style', seed: 1 },
    ];

    for (const bad of cases) {
      mocks.state.selectData = [
        { ...legacyRow(), planets: [{ ...legacyRow().planets[0], appearance: bad }] },
      ];
      const systems = await loadCustomSystems();
      expect(systems[0].planets[0].appearance).toBeUndefined();
    }
  });

  it('repairs individual fields that are the wrong type', async () => {
    mocks.state.selectData = [
      {
        ...legacyRow(),
        planets: [
          {
            ...legacyRow().planets[0],
            appearance: {
              surface: 'landmass',
              renderStyle: 'nonsense',
              seed: 'not-a-number',
              colorLow: 'rgb(1,2,3)',
              waterLevel: Number.NaN,
              rings: 0.5,
            },
          },
        ],
      },
    ];

    const systems = await loadCustomSystems();
    const restored = systems[0].planets[0].appearance;

    expect(restored).toBeDefined();
    expect(restored?.surface).toBe('landmass');
    expect(restored?.renderStyle).toBe('procedural');
    expect(restored?.seed).toBe(1337);
    expect(restored?.colorLow).toBe('#123a52');
    expect(restored?.waterLevel).toBe(0);
    expect(restored?.rings).toBe(0.5);
  });

  it('clamps out-of-range numbers so none reach a shader uniform', async () => {
    mocks.state.selectData = [
      {
        ...legacyRow(),
        planets: [
          {
            ...legacyRow().planets[0],
            appearance: {
              surface: 'landmass',
              renderStyle: 'procedural',
              seed: 1e12,
              atmosphere: 1e40,
              roughness: -50,
              clouds: 8,
            },
          },
        ],
      },
    ];

    const systems = await loadCustomSystems();
    const restored = systems[0].planets[0].appearance;

    expect(restored?.seed).toBe(99999);
    expect(restored?.atmosphere).toBe(1.5);
    expect(restored?.roughness).toBe(0);
    expect(restored?.clouds).toBe(1);
  });
});
