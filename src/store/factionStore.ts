import { create } from 'zustand';
import type { FactionConfig } from '@/types';
import {
  loadFactions,
  upsertFaction,
  deleteFactionFromDb,
  logAction,
  getAuthenticatedUserId,
} from '@/data/supabaseStorage';
import { logger } from '@/utils/logger';

const DEFAULT_FACTIONS: FactionConfig[] = [
  {
    id: 'galactic_republic',
    label: 'Galactic Republic',
    markerColor: '#FFD700',
    barColor: '#C8AA6E',
    sortOrder: 0,
    isBuiltin: true,
  },
  {
    id: 'sith_empire',
    label: 'Sith Empire',
    markerColor: '#DC143C',
    barColor: '#DC143C',
    sortOrder: 1,
    isBuiltin: true,
  },
  {
    id: 'hutt_cartel',
    label: 'Hutt Cartel',
    markerColor: '#8B9A46',
    barColor: '#8B9A46',
    sortOrder: 2,
    isBuiltin: true,
  },
  {
    id: 'neutral',
    label: 'Neutral',
    markerColor: '#808080',
    barColor: '#808080',
    sortOrder: 3,
    isBuiltin: true,
  },
  {
    id: 'contested',
    label: 'Contested',
    markerColor: '#FF8C00',
    barColor: '#FF8C00',
    sortOrder: 4,
    isBuiltin: true,
  },
];

const FALLBACK_LABEL = 'Unknown';
const FALLBACK_COLOR = '#808080';

interface FactionStore {
  factions: FactionConfig[];
  _map: Map<string, FactionConfig>;
  initializeFactions: () => Promise<void>;
  getFactionLabel: (id: string) => string;
  getFactionMarkerColor: (id: string) => string;
  getFactionBarColor: (id: string) => string;
  getFactionIds: () => string[];
  getFactionById: (id: string) => FactionConfig | undefined;
  createFaction: (config: Omit<FactionConfig, 'sortOrder' | 'isBuiltin'>) => Promise<void>;
  updateFaction: (
    id: string,
    updates: Partial<Pick<FactionConfig, 'label' | 'markerColor' | 'barColor'>>,
  ) => Promise<void>;
  removeFaction: (id: string) => Promise<boolean>;
}

function buildMap(factions: FactionConfig[]): Map<string, FactionConfig> {
  return new Map(factions.map((f) => [f.id, f]));
}

export const useFactionStore = create<FactionStore>((set, get) => ({
  factions: DEFAULT_FACTIONS,
  _map: buildMap(DEFAULT_FACTIONS),

  initializeFactions: async () => {
    try {
      const loaded = await loadFactions();
      if (loaded.length > 0) {
        // Merge: DB rows override defaults for matching IDs, append custom factions
        const dbMap = new Map(loaded.map((f) => [f.id, f]));
        const merged = DEFAULT_FACTIONS.map((d) => dbMap.get(d.id) ?? d);
        for (const f of loaded) {
          if (!merged.find((m) => m.id === f.id)) merged.push(f);
        }
        set({ factions: merged, _map: buildMap(merged) });
      }
    } catch (err) {
      logger.error('Failed to load factions from Supabase, using defaults:', err);
    }
  },

  getFactionLabel: (id: string) => get()._map.get(id)?.label ?? FALLBACK_LABEL,
  getFactionMarkerColor: (id: string) => get()._map.get(id)?.markerColor ?? FALLBACK_COLOR,
  getFactionBarColor: (id: string) => get()._map.get(id)?.barColor ?? FALLBACK_COLOR,
  getFactionIds: () => get().factions.map((f) => f.id),
  getFactionById: (id: string) => get()._map.get(id),

  createFaction: async (config) => {
    const newFaction: FactionConfig = {
      ...config,
      sortOrder: get().factions.length,
      isBuiltin: false,
    };
    const prev = get().factions;
    const next = [...prev, newFaction];
    set({ factions: next, _map: buildMap(next) });
    const uid = await getAuthenticatedUserId();
    if (uid) {
      try {
        await upsertFaction(newFaction, uid);
        logAction('faction_created', 'faction', newFaction.id, newFaction.label).catch(() => {});
      } catch (err) {
        logger.error('[factionStore] Failed to save faction, rolling back:', err);
        set({ factions: prev, _map: buildMap(prev) });
      }
    }
  },

  updateFaction: async (id, updates) => {
    const next = get().factions.map((f) => (f.id === id ? { ...f, ...updates } : f));
    set({ factions: next, _map: buildMap(next) });
    // Use upsert so builtins that were never persisted get created
    const updated = get()._map.get(id);
    if (updated) {
      const uid = await getAuthenticatedUserId();
      if (uid) {
        upsertFaction(updated, uid).catch((err: unknown) =>
          logger.error('[factionStore] Failed to persist faction update:', err),
        );
      }
    }
    const label = get()._map.get(id)?.label ?? id;
    logAction('faction_updated', 'faction', id, label, { fields: Object.keys(updates) }).catch(
      () => {},
    );
  },

  removeFaction: async (id) => {
    const faction = get()._map.get(id);
    if (!faction || faction.isBuiltin) return false;

    const prev = get().factions;
    const next = prev.filter((f) => f.id !== id);
    set({ factions: next, _map: buildMap(next) });
    try {
      await deleteFactionFromDb(id);
      logAction('faction_deleted', 'faction', id, id).catch(() => {});
      return true;
    } catch (err) {
      logger.error('[factionStore] Failed to delete faction, rolling back:', err);
      set({ factions: prev, _map: buildMap(prev) });
      return false;
    }
  },
}));
