import { create } from 'zustand';
import type { GalaxyUIStore } from '@/types';

export type ActiveModule = 'search' | 'timeline' | 'overview' | 'mapControls' | null;

export const useGalaxyUIStore = create<
  GalaxyUIStore & {
    activeModule: ActiveModule;
    setActiveModule: (module: ActiveModule) => void;
  }
>((set) => ({
  activeModule: null,
  setActiveModule: (module) =>
    set((state) => ({
      activeModule: state.activeModule === module ? null : module,
    })),

  showFleets: true,
  showLabels: true,
  showCivilianTraffic: true,
  toggleFleets: () => set((state) => ({ showFleets: !state.showFleets })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleCivilianTraffic: () =>
    set((state) => ({ showCivilianTraffic: !state.showCivilianTraffic })),

  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  factionFilters: {},
  toggleFactionFilter: (faction: string) =>
    set((state) => ({
      factionFilters: {
        ...state.factionFilters,
        [faction]: !(state.factionFilters[faction] ?? true),
      },
    })),
  syncFactionFilters: (factionIds: string[]) =>
    set((state) => {
      const next: Record<string, boolean> = {};
      for (const id of factionIds) {
        next[id] = state.factionFilters[id] ?? true;
      }
      return { factionFilters: next };
    }),

  placementMode: false,
  pendingCustomPlanet: null,
  draggingCustomPlanet: false,

  setPlacementMode: (mode, pending = null) =>
    set(() => ({
      placementMode: mode,
      pendingCustomPlanet: pending ?? null,
      ...(mode ? { fleetPlacementMode: false, pendingCustomFleet: null } : {}),
    })),

  setDraggingCustomPlanet: (dragging) => set({ draggingCustomPlanet: dragging }),

  fleetPlacementMode: false,
  pendingCustomFleet: null,
  draggingCustomFleet: false,

  setFleetPlacementMode: (mode, pending = null) =>
    set(() => ({
      fleetPlacementMode: mode,
      pendingCustomFleet: pending ?? null,
      ...(mode ? { placementMode: false, pendingCustomPlanet: null } : {}),
    })),

  setDraggingCustomFleet: (dragging) => set({ draggingCustomFleet: dragging }),
}));
