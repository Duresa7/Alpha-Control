import { create } from 'zustand';
import type { GalaxySelectionStore, InfoPanelData } from '@/types';

export const useGalaxySelectionStore = create<GalaxySelectionStore>((set) => ({
  viewMode: 'topdown',
  selectedSystemId: null,
  selectedPlanetId: null,
  selectedFleetId: null,

  setSelectedSystem: (id: string | null) =>
    set({
      selectedSystemId: id,
      selectedPlanetId: null,
      selectedFleetId: null,
      viewMode: id ? 'system' : 'topdown',
    }),

  setSelectedPlanet: (id: string | null) => set({ selectedPlanetId: id }),

  setSelectedFleet: (id: string | null) =>
    set({
      selectedFleetId: id,
      selectedSystemId: null,
      selectedPlanetId: null,
      viewMode: id ? 'fleet' : 'topdown',
    }),

  setTopDownSelection: (systemId, planetId = null) =>
    set({
      selectedSystemId: systemId,
      selectedPlanetId: planetId ?? null,
      selectedFleetId: null,
    }),

  setTopDownFleetSelection: (fleetId) =>
    set({
      selectedFleetId: fleetId,
      selectedSystemId: null,
      selectedPlanetId: null,
    }),

  infoPanelData: null,
  setInfoPanelData: (data: InfoPanelData | null) => set({ infoPanelData: data }),

  resetCameraFlag: false,
  requestCameraReset: () => set({ resetCameraFlag: true }),
  clearResetCameraFlag: () => set({ resetCameraFlag: false }),
  zoomDelta: 0,
  requestZoom: (delta: number) => set({ zoomDelta: delta }),
  clearZoomDelta: () => set({ zoomDelta: 0 }),
}));
