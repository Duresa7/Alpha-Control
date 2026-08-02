import { create } from 'zustand';
import type {
  GalaxyDataStore,
  InfoPanelData,
  Planet,
  PlanetStatsUpdate,
  FleetStatsUpdate,
  StarSystem,
  Fleet,
} from '@/types';
import { starSystems, fleets } from '@/data/galaxyData';
import {
  loadCustomSystems as loadFromSupabase,
  loadCustomFleets as loadFleetsFromSupabase,
  insertCustomSystem,
  batchUpsertSystems,
  deleteCustomSystem as deleteSystemFromSupabase,
  insertCustomFleet,
  batchUpsertFleets,
  deleteCustomFleet as deleteFleetFromSupabase,
  logAction,
  loadSetting,
  updateSetting,
  getAuthenticatedUserId,
} from '@/data/supabaseStorage';
import { TOPDOWN_MARKER_MAX_SIZE, TOPDOWN_MARKER_MIN_SIZE } from '@/config/topDownMarkerConfig';
import { clamp } from '@/utils/math';
import { logger } from '@/utils/logger';
import { useGalaxySelectionStore } from './galaxySelectionStore';
import { useGalaxyUIStore } from './galaxyUIStore';
import { useFactionStore } from './factionStore';

const DEFAULT_TIMELINE_YEAR = 180;

const cloneSystem = (system: StarSystem): StarSystem => ({
  ...system,
  position: system.position.clone(),
  planets: system.planets.map((planet) => ({ ...planet, position: planet.position.clone() })),
});

const cloneFleet = (fleet: Fleet): Fleet => ({
  ...fleet,
  position: fleet.position.clone(),
});

const cloneSystems = (systems: StarSystem[]): StarSystem[] => systems.map((s) => cloneSystem(s));

const cloneFleets = (fleetArr: Fleet[]): Fleet[] => fleetArr.map((f) => cloneFleet(f));

let _systemsSnapshot: StarSystem[] = [];
let _fleetsSnapshot: Fleet[] = [];
let _yearSnapshot: number = DEFAULT_TIMELINE_YEAR;

let _systemsArrRef: StarSystem[] = [];
let _systemsMap = new Map<string, StarSystem>();
let _fleetsArrRef: Fleet[] = [];
let _fleetsMap = new Map<string, Fleet>();

function getSystemsMap(systems: StarSystem[]): Map<string, StarSystem> {
  if (systems !== _systemsArrRef) {
    _systemsArrRef = systems;
    _systemsMap = new Map(systems.map((s) => [s.id, s]));
  }
  return _systemsMap;
}

function getFleetsMap(fleets: Fleet[]): Map<string, Fleet> {
  if (fleets !== _fleetsArrRef) {
    _fleetsArrRef = fleets;
    _fleetsMap = new Map(fleets.map((f) => [f.id, f]));
  }
  return _fleetsMap;
}
const _pendingPlanetAudits: Map<
  string,
  { systemId: string; planetName: string; fields: Set<string> }
> = new Map();

const shouldClearPanelForSystem = (panel: InfoPanelData | null, systemId: string): boolean => {
  if (!panel) return false;
  if (panel.type === 'system') return panel.data.id === systemId;
  if (panel.type === 'planet') return panel.data.systemId === systemId;
  return false;
};

const shouldClearPanelForFleet = (panel: InfoPanelData | null, fleetId: string): boolean => {
  return panel?.type === 'fleet' && panel.data.id === fleetId;
};

const hasOwn = (obj: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const clampMarkerSize = (value: number): number =>
  clamp(value, TOPDOWN_MARKER_MIN_SIZE, TOPDOWN_MARKER_MAX_SIZE);

const NULLABLE_PATCH_FIELDS = [
  'hyperlanes',
  'climate',
  'terrain',
  'notable',
  'nativeInhabitants',
  'factionControl',
  'customColor',
  'customType',
  'appearance',
] as const;

const applyPlanetStatsPatch = (planet: Planet, updates: PlanetStatsUpdate): Planet => {
  const next: Planet = { ...planet };

  for (const key of NULLABLE_PATCH_FIELDS) {
    if (hasOwn(updates, key)) {
      (next as unknown as Record<string, unknown>)[key] = updates[key] ?? undefined;
    }
  }
  if (hasOwn(updates, 'description')) next.description = updates.description ?? '';
  if (hasOwn(updates, 'faction') && updates.faction) next.faction = updates.faction;

  return next;
};

const auditLog = (
  action: import('@/types').AuditAction,
  entityType: 'system' | 'fleet' | 'user',
  entityId: string,
  entityName: string,
  details?: Record<string, unknown>,
) => {
  logAction(action, entityType, entityId, entityName, details).catch(() => {});
};

const mergeById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
  if (incoming.length === 0) return current;

  const overrideMap = new Map(incoming.map((item) => [item.id, item]));
  const merged = current.map((item) => overrideMap.get(item.id) ?? item);
  const existingIds = new Set(current.map((item) => item.id));
  for (const item of incoming) {
    if (existingIds.has(item.id)) continue;
    merged.push(item);
    existingIds.add(item.id);
  }

  return merged;
};

const _baseSystemsById = new Map(starSystems.map((s) => [s.id, s]));
const _baseFleetsById = new Map(fleets.map((f) => [f.id, f]));

/**
 * A remote delete removes the `custom_*` override row, not the entity itself.
 * Entities that also exist in the bundled galaxy data revert to their base
 * definition; purely custom ones disappear.
 */
const applyRemoteDeletion = <T extends { id: string }>(
  items: T[],
  id: string,
  base: T | undefined,
  clone: (item: T) => T,
): T[] =>
  base
    ? items.map((item) => (item.id === id ? clone(base) : item))
    : items.filter((item) => item.id !== id);

const mergeSavedSnapshotEntries = <T extends { id: string }>(
  currentSnapshot: T[],
  latestData: T[],
  attemptedIds: Set<string>,
  failedIds: Set<string>,
  cloneItem: (item: T) => T,
): T[] => {
  if (attemptedIds.size === 0) return currentSnapshot;

  const latestById = new Map(latestData.map((item) => [item.id, item]));
  const nextSnapshot = currentSnapshot.map((item) => {
    if (!attemptedIds.has(item.id) || failedIds.has(item.id)) {
      return item;
    }

    const latestItem = latestById.get(item.id);
    return latestItem ? cloneItem(latestItem) : item;
  });

  const existingIds = new Set(nextSnapshot.map((item) => item.id));
  for (const id of attemptedIds) {
    if (failedIds.has(id) || existingIds.has(id)) continue;
    const latestItem = latestById.get(id);
    if (!latestItem) continue;
    nextSnapshot.push(cloneItem(latestItem));
    existingIds.add(id);
  }

  return nextSnapshot;
};

export const useGalaxyDataStore = create<GalaxyDataStore>((set, get) => ({
  systems: [...starSystems],
  fleets: [...fleets],
  isLoading: true,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  currentYear: DEFAULT_TIMELINE_YEAR,
  setCurrentYear: (year: number) =>
    set({ currentYear: year, dirtyTimeline: true, hasPendingChanges: true }),

  getFilteredSystems: () => {
    const state = get();
    const { searchQuery, factionFilters } = useGalaxyUIStore.getState();
    const query = searchQuery.toLowerCase().trim();

    return state.systems.filter((system) => {
      if (factionFilters[system.faction] === false) {
        return false;
      }

      if (query) {
        const matchesName = system.name.toLowerCase().includes(query);
        const matchesRegion = system.region.replace('_', ' ').toLowerCase().includes(query);
        const matchesPlanets = system.planets.some((p) => p.name.toLowerCase().includes(query));
        return matchesName || matchesRegion || matchesPlanets;
      }

      return true;
    });
  },
  getFactionStats: () => {
    const state = get();
    const factionIds = useFactionStore.getState().getFactionIds();
    const stats: Record<string, { planets: number; fleets: number; shipUnits: number }> = {};
    for (const id of factionIds) {
      stats[id] = { planets: 0, fleets: 0, shipUnits: 0 };
    }
    for (const system of state.systems) {
      for (const planet of system.planets) {
        if (!stats[planet.faction]) stats[planet.faction] = { planets: 0, fleets: 0, shipUnits: 0 };
        stats[planet.faction].planets++;
      }
    }
    for (const fleet of state.fleets) {
      if (!Number.isFinite(fleet.shipCount)) continue;
      if (!stats[fleet.faction]) stats[fleet.faction] = { planets: 0, fleets: 0, shipUnits: 0 };
      stats[fleet.faction].fleets++;
      stats[fleet.faction].shipUnits += fleet.shipCount;
    }
    return stats;
  },

  initializeData: async () => {
    try {
      const [customSystems, customFleets, yearSetting] = await Promise.all([
        loadFromSupabase(),
        loadFleetsFromSupabase(),
        loadSetting('current_year'),
      ]);

      const loadedYear = typeof yearSetting === 'number' ? yearSetting : DEFAULT_TIMELINE_YEAR;
      set(() => ({
        systems: mergeById([...starSystems], customSystems),
        fleets: mergeById([...fleets], customFleets),
        currentYear: loadedYear,
        isLoading: false,
      }));
      const s = get();
      _systemsSnapshot = cloneSystems(s.systems);
      _fleetsSnapshot = cloneFleets(s.fleets);
      _yearSnapshot = loadedYear;
    } catch (err) {
      logger.error('Failed to initialize custom data from Supabase:', err);
      set({ isLoading: false });
    }
  },

  applyRemoteSystemUpsert: (system) => {
    if (get().dirtySystemIds.has(system.id)) return;
    set((state) => ({ systems: mergeById(state.systems, [system]) }));
    _systemsSnapshot = mergeById(_systemsSnapshot, [cloneSystem(system)]);
  },

  applyRemoteSystemDelete: (id) => {
    if (get().dirtySystemIds.has(id)) return;
    const base = _baseSystemsById.get(id);
    set((state) => ({
      systems: applyRemoteDeletion(state.systems, id, base, cloneSystem),
    }));
    _systemsSnapshot = applyRemoteDeletion(_systemsSnapshot, id, base, cloneSystem);

    if (base) return;
    const selStore = useGalaxySelectionStore.getState();
    if (selStore.selectedSystemId === id) selStore.setSelectedSystem(null);
    if (shouldClearPanelForSystem(selStore.infoPanelData, id)) selStore.setInfoPanelData(null);
  },

  applyRemoteFleetUpsert: (fleet) => {
    if (get().dirtyFleetIds.has(fleet.id)) return;
    set((state) => ({ fleets: mergeById(state.fleets, [fleet]) }));
    _fleetsSnapshot = mergeById(_fleetsSnapshot, [cloneFleet(fleet)]);
  },

  applyRemoteFleetDelete: (id) => {
    if (get().dirtyFleetIds.has(id)) return;
    const base = _baseFleetsById.get(id);
    set((state) => ({
      fleets: applyRemoteDeletion(state.fleets, id, base, cloneFleet),
    }));
    _fleetsSnapshot = applyRemoteDeletion(_fleetsSnapshot, id, base, cloneFleet);

    if (base) return;
    const selStore = useGalaxySelectionStore.getState();
    if (selStore.selectedFleetId === id) selStore.setSelectedFleet(null);
    if (shouldClearPanelForFleet(selStore.infoPanelData, id)) selStore.setInfoPanelData(null);
  },

  applyRemoteYear: (year) => {
    if (get().dirtyTimeline) return;
    set({ currentYear: year });
    _yearSnapshot = year;
  },

  updatePlanetStats: (systemId, planetId, updates) => {
    const state = get();
    const sysMap = getSystemsMap(state.systems);
    const resolvedSystem = sysMap.get(systemId);
    if (!resolvedSystem) return;

    const currentPlanet = resolvedSystem.planets.find((p) => p.id === planetId);
    if (!currentPlanet) return;

    set((currentState) => ({
      systems: currentState.systems.map((s) => {
        const isTargetSystem = s.id === resolvedSystem.id;
        if (!isTargetSystem) return s;
        return {
          ...s,
          planets: s.planets.map((p) =>
            p.id === planetId ? applyPlanetStatsPatch(p, updates) : p,
          ),
        };
      }),
      dirtySystemIds: new Set(currentState.dirtySystemIds).add(resolvedSystem.id),
      hasPendingChanges: true,
    }));

    const existing = _pendingPlanetAudits.get(planetId);
    const changedFields = Object.keys(updates);
    if (existing) {
      changedFields.forEach((f) => existing.fields.add(f));
    } else {
      _pendingPlanetAudits.set(planetId, {
        systemId: resolvedSystem.id,
        planetName: currentPlanet.name,
        fields: new Set(changedFields),
      });
    }
  },

  addCustomSystem: (system) => {
    set((state) => ({
      systems: [...state.systems, system],
    }));
    useGalaxyUIStore.getState().setPlacementMode(false);
    getAuthenticatedUserId().then((uid) => {
      if (uid) {
        insertCustomSystem(system, uid).catch((err) =>
          logger.error('[galaxyDataStore] Failed to save system:', err),
        );
        auditLog('system_created', 'system', system.id, system.name);
      }
    });
  },

  removeCustomSystem: (id) => {
    const systemToRemove = getSystemsMap(get().systems).get(id);
    set((state) => ({
      systems: state.systems.filter((s) => s.id !== id),
    }));
    const selStore = useGalaxySelectionStore.getState();
    if (selStore.selectedSystemId === id) {
      selStore.setSelectedSystem(null);
    }
    if (shouldClearPanelForSystem(selStore.infoPanelData, id)) {
      selStore.setInfoPanelData(null);
    }
    deleteSystemFromSupabase(id).catch((err) =>
      logger.error('[galaxyDataStore] Failed to delete system:', err),
    );
    if (systemToRemove) {
      auditLog('system_deleted', 'system', id, systemToRemove.name);
    }
  },

  previewCustomSystemPosition: (id, position) => {
    if (!getSystemsMap(get().systems).has(id)) return;

    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, position: position.clone() } : s)),
    }));
  },

  updateCustomSystemPosition: (id, position) => {
    if (!getSystemsMap(get().systems).has(id)) return;

    set((state) => ({
      systems: state.systems.map((s) =>
        s.id === id
          ? { ...s, position: position.clone(), planets: s.planets.map((p) => ({ ...p })) }
          : s,
      ),
      dirtySystemIds: new Set(state.dirtySystemIds).add(id),
      hasPendingChanges: true,
    }));
  },

  updateCustomSystemMarkerSize: (id, markerSize) => {
    if (!getSystemsMap(get().systems).has(id)) return;

    const size = clampMarkerSize(markerSize);
    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, markerSize: size } : s)),
      dirtySystemIds: new Set(state.dirtySystemIds).add(id),
      hasPendingChanges: true,
    }));
  },

  addCustomFleet: (fleet) => {
    set((state) => ({
      fleets: [...state.fleets, fleet],
    }));
    useGalaxyUIStore.getState().setFleetPlacementMode(false);
    getAuthenticatedUserId().then((uid) => {
      if (uid) {
        insertCustomFleet(fleet, uid).catch((err) =>
          logger.error('[galaxyDataStore] Failed to save fleet:', err),
        );
        auditLog('fleet_created', 'fleet', fleet.id, fleet.name);
      }
    });
  },

  removeCustomFleet: (id) => {
    const fleetToRemove = getFleetsMap(get().fleets).get(id);
    set((state) => ({
      fleets: state.fleets.filter((f) => f.id !== id),
    }));
    const selStore = useGalaxySelectionStore.getState();
    if (selStore.selectedFleetId === id) {
      selStore.setSelectedFleet(null);
    }
    if (shouldClearPanelForFleet(selStore.infoPanelData, id)) {
      selStore.setInfoPanelData(null);
    }
    deleteFleetFromSupabase(id).catch((err) =>
      logger.error('[galaxyDataStore] Failed to delete fleet:', err),
    );
    if (fleetToRemove) {
      auditLog('fleet_deleted', 'fleet', id, fleetToRemove.name);
    }
  },

  previewCustomFleetPosition: (id, position) => {
    if (!getFleetsMap(get().fleets).has(id)) return;

    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
    }));
  },

  updateCustomFleetPosition: (id, position) => {
    if (!getFleetsMap(get().fleets).has(id)) return;

    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
      dirtyFleetIds: new Set(state.dirtyFleetIds).add(id),
      hasPendingChanges: true,
    }));
  },

  updateFleetMarkerSize: (id, markerSize) => {
    if (!getFleetsMap(get().fleets).has(id)) return;

    const size = clampMarkerSize(markerSize);
    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, markerSize: size } : f)),
      dirtyFleetIds: new Set(state.dirtyFleetIds).add(id),
      hasPendingChanges: true,
    }));
  },

  updateFleetStats: (id: string, updates: FleetStatsUpdate) => {
    const existing = getFleetsMap(get().fleets).get(id);
    if (!existing) return;

    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      dirtyFleetIds: new Set(state.dirtyFleetIds).add(id),
      hasPendingChanges: true,
    }));

    auditLog('fleet_updated', 'fleet', id, updates.name ?? existing.name, {
      fields: Object.keys(updates),
    });
  },

  dirtySystemIds: new Set<string>(),
  dirtyFleetIds: new Set<string>(),
  dirtyTimeline: false,
  hasPendingChanges: false,

  saveAllChanges: async () => {
    const state = get();
    const uid = await getAuthenticatedUserId();
    if (!uid) return;

    const failedSystemIds = new Set<string>();
    const failedFleetIds = new Set<string>();

    const sysMap = getSystemsMap(state.systems);
    const fltMap = getFleetsMap(state.fleets);

    const dirtySystems = [...state.dirtySystemIds]
      .map((id) => sysMap.get(id))
      .filter((s): s is StarSystem => !!s);

    const dirtyFleets = [...state.dirtyFleetIds]
      .map((id) => fltMap.get(id))
      .filter((f): f is Fleet => !!f);

    try {
      await batchUpsertSystems(dirtySystems, uid);
      for (const system of dirtySystems) {
        const planetAudits = [..._pendingPlanetAudits.entries()].filter(
          ([, v]) => v.systemId === system.id,
        );
        if (planetAudits.length > 0) {
          for (const [pId, audit] of planetAudits) {
            auditLog('planet_stats_updated', 'system', pId, audit.planetName, {
              fields: [...audit.fields],
            });
            _pendingPlanetAudits.delete(pId);
          }
        } else {
          auditLog('system_moved', 'system', system.id, system.name);
        }
      }
    } catch (error) {
      logger.error('Failed to batch save systems:', error);
      for (const s of dirtySystems) failedSystemIds.add(s.id);
    }

    try {
      await batchUpsertFleets(dirtyFleets, uid);
      for (const fleet of dirtyFleets) {
        auditLog('fleet_moved', 'fleet', fleet.id, fleet.name);
      }
    } catch (error) {
      logger.error('Failed to batch save fleets:', error);
      for (const f of dirtyFleets) failedFleetIds.add(f.id);
    }

    let timelineFailed = false;
    if (state.dirtyTimeline) {
      try {
        await updateSetting('current_year', state.currentYear);
        auditLog('timeline_changed', 'system', 'current_year', 'Timeline', {
          year: state.currentYear,
        });
      } catch (error) {
        logger.error('Failed to save timeline setting:', error);
        timelineFailed = true;
      }
    }

    const nextDirtySystemIds = failedSystemIds;
    const nextDirtyFleetIds = failedFleetIds;
    const nextDirtyTimeline = timelineFailed;
    const hasPendingChanges =
      nextDirtySystemIds.size > 0 || nextDirtyFleetIds.size > 0 || nextDirtyTimeline;

    set({
      dirtySystemIds: nextDirtySystemIds,
      dirtyFleetIds: nextDirtyFleetIds,
      dirtyTimeline: nextDirtyTimeline,
      hasPendingChanges,
    });

    const saved = get();
    _systemsSnapshot = mergeSavedSnapshotEntries(
      _systemsSnapshot,
      saved.systems,
      state.dirtySystemIds,
      failedSystemIds,
      cloneSystem,
    );
    _fleetsSnapshot = mergeSavedSnapshotEntries(
      _fleetsSnapshot,
      saved.fleets,
      state.dirtyFleetIds,
      failedFleetIds,
      cloneFleet,
    );
    if (state.dirtyTimeline && !timelineFailed) {
      _yearSnapshot = saved.currentYear;
    }
  },

  discardAllChanges: async () => {
    _pendingPlanetAudits.clear();
    set({
      systems: cloneSystems(_systemsSnapshot),
      fleets: cloneFleets(_fleetsSnapshot),
      currentYear: _yearSnapshot,
      dirtySystemIds: new Set<string>(),
      dirtyFleetIds: new Set<string>(),
      dirtyTimeline: false,
      hasPendingChanges: false,
    });
  },
}));
