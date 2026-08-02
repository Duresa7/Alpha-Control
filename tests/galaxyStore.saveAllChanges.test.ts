import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fleet, StarSystem } from '../src/types';
import {
  TOPDOWN_MARKER_MAX_SIZE,
  TOPDOWN_MARKER_MIN_SIZE,
} from '../src/config/topDownMarkerConfig';

const mocks = vi.hoisted(() => ({
  loadCustomSystems: vi.fn<() => Promise<StarSystem[]>>(async () => []),
  loadCustomFleets: vi.fn<() => Promise<Fleet[]>>(async () => []),
  insertCustomSystem: vi.fn(async () => {}),
  batchUpsertSystems: vi.fn(async () => {}),
  deleteCustomSystem: vi.fn(async () => {}),
  insertCustomFleet: vi.fn(async () => {}),
  batchUpsertFleets: vi.fn(async () => {}),
  deleteCustomFleet: vi.fn(async () => {}),
  logAction: vi.fn(async () => {}),
  loadSetting: vi.fn<() => Promise<number | null>>(async () => null),
  updateSetting: vi.fn(async () => {}),
  getAuthenticatedUserId: vi.fn<() => Promise<string | null>>(async () => 'user-1'),
}));

vi.mock('@/data/supabaseStorage', () => ({
  loadCustomSystems: mocks.loadCustomSystems,
  loadCustomFleets: mocks.loadCustomFleets,
  insertCustomSystem: mocks.insertCustomSystem,
  batchUpsertSystems: mocks.batchUpsertSystems,
  deleteCustomSystem: mocks.deleteCustomSystem,
  insertCustomFleet: mocks.insertCustomFleet,
  batchUpsertFleets: mocks.batchUpsertFleets,
  deleteCustomFleet: mocks.deleteCustomFleet,
  logAction: mocks.logAction,
  loadSetting: mocks.loadSetting,
  updateSetting: mocks.updateSetting,
  getAuthenticatedUserId: mocks.getAuthenticatedUserId,
}));

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    },
  },
}));

import { useGalaxyDataStore } from '../src/store/galaxyDataStore';

const buildSystem = (id: string): StarSystem => ({
  id,
  name: id,
  position: new THREE.Vector3(0, 0, 0),
  faction: 'neutral',
  starType: 'white',
  importance: 'minor',
  description: `${id} description`,
  region: 'unknown_regions',
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
    },
  ],
});

const buildFleet = (id: string): Fleet => ({
  id,
  name: id,
  faction: 'neutral',
  position: new THREE.Vector3(0, 0, 0),
  shipCount: 10,
  modelType: 'republic',
});

describe('useGalaxyDataStore.saveAllChanges', () => {
  beforeEach(() => {
    mocks.loadCustomSystems.mockReset();
    mocks.loadCustomFleets.mockReset();
    mocks.loadSetting.mockReset();
    mocks.batchUpsertSystems.mockReset();
    mocks.batchUpsertFleets.mockReset();
    mocks.updateSetting.mockReset();
    mocks.logAction.mockReset();
    mocks.getAuthenticatedUserId.mockReset();

    mocks.loadCustomSystems.mockResolvedValue([]);
    mocks.loadCustomFleets.mockResolvedValue([]);
    mocks.loadSetting.mockResolvedValue(null);
    mocks.getAuthenticatedUserId.mockResolvedValue('user-1');
    (mocks.batchUpsertSystems as ReturnType<typeof vi.fn>).mockImplementation(
      async (systems: StarSystem[]) => {
        if (systems.some((s) => s.id === 'system-fail')) {
          throw new Error('failed write');
        }
      },
    );
    mocks.batchUpsertFleets.mockResolvedValue(undefined);
    mocks.updateSetting.mockResolvedValue(undefined);
    mocks.logAction.mockResolvedValue(undefined);

    useGalaxyDataStore.setState({
      systems: [buildSystem('system-ok'), buildSystem('system-fail')],
      fleets: [buildFleet('fleet-ok')],
      currentYear: 4100,
      dirtySystemIds: new Set(['system-ok', 'system-fail']),
      dirtyFleetIds: new Set(['fleet-ok']),
      dirtyTimeline: true,
      hasPendingChanges: true,
    });
  });

  it('keeps failed entities dirty and clears successful entities', async () => {
    await useGalaxyDataStore.getState().saveAllChanges();

    const state = useGalaxyDataStore.getState();

    // Batch upserts are called once per type (not per entity)
    expect(mocks.batchUpsertSystems).toHaveBeenCalledTimes(1);
    expect(mocks.batchUpsertFleets).toHaveBeenCalledTimes(1);
    expect(mocks.updateSetting).toHaveBeenCalledTimes(1);

    // System batch failed → all dirty system IDs stay dirty
    expect(state.dirtySystemIds.has('system-fail')).toBe(true);
    expect(state.dirtySystemIds.has('system-ok')).toBe(true);
    expect(state.dirtyFleetIds.size).toBe(0);
    expect(state.dirtyTimeline).toBe(false);
    expect(state.hasPendingChanges).toBe(true);
  });

  it('tracks hyperlane planet edits as dirty system saves and audit fields', async () => {
    useGalaxyDataStore.setState({
      systems: [buildSystem('system-ok')],
      fleets: [],
      dirtySystemIds: new Set<string>(),
      dirtyFleetIds: new Set<string>(),
      dirtyTimeline: false,
      hasPendingChanges: false,
    });

    useGalaxyDataStore.getState().updatePlanetStats('system-ok', 'system-ok-prime', {
      hyperlanes: ['Hydian Way', 'Perlemian Trade Route'],
    });

    let state = useGalaxyDataStore.getState();
    expect(state.dirtySystemIds.has('system-ok')).toBe(true);
    expect(state.hasPendingChanges).toBe(true);

    await state.saveAllChanges();

    state = useGalaxyDataStore.getState();
    expect(state.dirtySystemIds.size).toBe(0);
    expect(state.hasPendingChanges).toBe(false);
    expect(mocks.batchUpsertSystems).toHaveBeenCalledTimes(1);
    expect(mocks.logAction).toHaveBeenCalledWith(
      'planet_stats_updated',
      'system',
      'system-ok-prime',
      'system-ok Prime',
      { fields: ['hyperlanes'] },
    );
  });

  it('initializes custom data and restores snapshots on discard', async () => {
    const customSystem = {
      ...buildSystem('custom-system'),
      position: new THREE.Vector3(9, 1, 3),
      isCustom: true,
    };
    const customFleet = {
      ...buildFleet('custom-fleet'),
      position: new THREE.Vector3(4, 2, 8),
      isCustom: true,
    };

    mocks.loadCustomSystems.mockResolvedValue([customSystem]);
    mocks.loadCustomFleets.mockResolvedValue([customFleet]);
    mocks.loadSetting.mockResolvedValue(4123);

    await useGalaxyDataStore.getState().initializeData();

    let state = useGalaxyDataStore.getState();
    expect(state.currentYear).toBe(4123);
    expect(state.systems.find((system) => system.id === 'custom-system')?.position.x).toBe(9);
    expect(state.fleets.find((fleet) => fleet.id === 'custom-fleet')?.position.z).toBe(8);

    state.updateCustomSystemPosition('custom-system', new THREE.Vector3(20, 0, 20));
    state.updateCustomFleetPosition('custom-fleet', new THREE.Vector3(30, 0, 30));
    state.setCurrentYear(5000);

    await state.discardAllChanges();

    state = useGalaxyDataStore.getState();
    expect(state.systems.find((system) => system.id === 'custom-system')?.position.x).toBe(9);
    expect(state.fleets.find((fleet) => fleet.id === 'custom-fleet')?.position.x).toBe(4);
    expect(state.currentYear).toBe(4123);
    expect(state.hasPendingChanges).toBe(false);
  });

  it('clamps marker sizes through store updates instead of raw helper tests', () => {
    useGalaxyDataStore.setState({
      systems: [buildSystem('system-ok')],
      fleets: [buildFleet('fleet-ok')],
      dirtySystemIds: new Set<string>(),
      dirtyFleetIds: new Set<string>(),
      dirtyTimeline: false,
      hasPendingChanges: false,
    });

    useGalaxyDataStore.getState().updateCustomSystemMarkerSize('system-ok', 999);
    useGalaxyDataStore.getState().updateFleetMarkerSize('fleet-ok', -10);

    const state = useGalaxyDataStore.getState();
    expect(state.systems.find((system) => system.id === 'system-ok')?.markerSize).toBe(
      TOPDOWN_MARKER_MAX_SIZE,
    );
    expect(state.fleets.find((fleet) => fleet.id === 'fleet-ok')?.markerSize).toBe(
      TOPDOWN_MARKER_MIN_SIZE,
    );
  });

  it('keeps the timeline dirty when saving the year fails', async () => {
    mocks.updateSetting.mockRejectedValue(new Error('timeline failed'));

    useGalaxyDataStore.setState({
      systems: [],
      fleets: [],
      currentYear: 4400,
      dirtySystemIds: new Set<string>(),
      dirtyFleetIds: new Set<string>(),
      dirtyTimeline: true,
      hasPendingChanges: true,
    });

    await useGalaxyDataStore.getState().saveAllChanges();

    const state = useGalaxyDataStore.getState();
    expect(state.dirtyTimeline).toBe(true);
    expect(state.hasPendingChanges).toBe(true);
  });

  it('preserves successful snapshots while failed entities still discard back to the previous saved state', async () => {
    const customSystem = {
      ...buildSystem('system-fail'),
      position: new THREE.Vector3(1, 0, 1),
      isCustom: true,
    };
    const customFleet = {
      ...buildFleet('fleet-ok'),
      position: new THREE.Vector3(2, 0, 2),
      isCustom: true,
    };

    mocks.loadCustomSystems.mockResolvedValue([customSystem]);
    mocks.loadCustomFleets.mockResolvedValue([customFleet]);

    await useGalaxyDataStore.getState().initializeData();

    useGalaxyDataStore
      .getState()
      .updateCustomSystemPosition('system-fail', new THREE.Vector3(10, 0, 10));
    useGalaxyDataStore
      .getState()
      .updateCustomFleetPosition('fleet-ok', new THREE.Vector3(20, 0, 20));

    await useGalaxyDataStore.getState().saveAllChanges();

    useGalaxyDataStore
      .getState()
      .updateCustomSystemPosition('system-fail', new THREE.Vector3(30, 0, 30));
    useGalaxyDataStore
      .getState()
      .updateCustomFleetPosition('fleet-ok', new THREE.Vector3(40, 0, 40));

    await useGalaxyDataStore.getState().discardAllChanges();

    const state = useGalaxyDataStore.getState();
    expect(state.systems.find((system) => system.id === 'system-fail')?.position.x).toBe(1);
    expect(state.fleets.find((fleet) => fleet.id === 'fleet-ok')?.position.x).toBe(20);
  });
});
