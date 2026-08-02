import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StarSystem } from '../src/types';

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
    auth: {
      getUser: mocks.authGetUser,
    },
  },
}));

import { batchUpsertSystems, loadCustomSystems } from '../src/data/supabaseStorage';

const buildSystem = (id: string, hyperlanes?: string[]): StarSystem => ({
  id,
  name: id,
  position: new THREE.Vector3(10, 0, 5),
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
      type: 'terrestrial',
      position: new THREE.Vector3(0, 0, 0),
      radius: 1,
      faction: 'neutral',
      description: `${id} Prime description`,
      systemId: id,
      hyperlanes,
    },
  ],
});

describe('supabaseStorage hyperlane system mapping', () => {
  beforeEach(() => {
    mocks.from.mockClear();
    mocks.state.selectData = [];
  });

  const getLatestFromCall = () => {
    const latest = mocks.from.mock.results[mocks.from.mock.results.length - 1];
    return latest?.value as { upsert: ReturnType<typeof vi.fn> };
  };

  it('maps saved hyperlane arrays when loading custom systems', async () => {
    mocks.state.selectData = [
      {
        id: 'system-1',
        name: 'System One',
        position_x: 10,
        position_y: 0,
        position_z: 5,
        custom_color: null,
        marker_size: null,
        planets: [
          {
            id: 'system-1-prime',
            name: 'System One Prime',
            type: 'terrestrial',
            radius: 1,
            faction: 'neutral',
            description: 'System One Prime description',
            hyperlanes: ['Hydian Way', 'Perlemian Trade Route'],
          },
        ],
        created_by: null,
      },
    ];

    const systems = await loadCustomSystems();

    expect(systems).toHaveLength(1);
    expect(systems[0].planets[0].hyperlanes).toEqual(['Hydian Way', 'Perlemian Trade Route']);
    expect((systems[0].planets[0] as { population?: unknown }).population).toBeUndefined();
  });

  it('persists hyperlanes and omits legacy population keys on system upsert', async () => {
    await batchUpsertSystems(
      [buildSystem('system-1', ['Hydian Way', 'Perlemian Trade Route']), buildSystem('system-2')],
      'user-1',
    );

    const customSystemCall = getLatestFromCall();

    expect(mocks.from).toHaveBeenCalledWith('custom_systems');
    expect(customSystemCall.upsert).toHaveBeenCalledTimes(1);

    const [rows] = customSystemCall.upsert.mock.calls[0];
    expect(rows[0].planets[0].hyperlanes).toEqual(['Hydian Way', 'Perlemian Trade Route']);
    expect('population' in rows[0].planets[0]).toBe(false);
    expect('hyperlanes' in rows[1].planets[0]).toBe(false);
  });
});
