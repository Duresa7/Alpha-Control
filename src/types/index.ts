import * as THREE from 'three';
export type ViewMode = 'topdown' | 'system' | 'fleet';
export type Faction = string;
export type BuiltinFactionId =
  'sith_empire' | 'galactic_republic' | 'neutral' | 'contested' | 'hutt_cartel';
export type ShipModelType = 'sith' | 'republic' | 'valor' | 'terminus';
export type FactionFilters = Record<string, boolean>;

export interface FactionConfig {
  id: string;
  label: string;
  markerColor: string;
  barColor: string;
  sortOrder: number;
  isBuiltin: boolean;
}
export type PlanetType =
  | 'terrestrial'
  | 'gas_giant'
  | 'ice'
  | 'desert'
  | 'volcanic'
  | 'ocean'
  | 'jungle'
  | 'city'
  | 'barren'
  | 'destroyed';
export type PlanetSurfaceStyle =
  'landmass' | 'dunes' | 'icy' | 'ridged' | 'urban' | 'bands' | 'cratered';
export type PlanetRenderStyle = 'procedural' | 'holo';

/**
 * Drives the procedural planet shader. Generated entirely from `seed`, so a
 * planet costs nothing to store or serve beyond these few numbers.
 */
export interface PlanetAppearance {
  renderStyle: PlanetRenderStyle;
  surface: PlanetSurfaceStyle;
  seed: number;
  colorLow: string;
  colorMid: string;
  colorHigh: string;
  /** Floods everything below this height with `colorLow`; 0 disables water. */
  waterLevel: number;
  iceCaps: number;
  clouds: number;
  cloudColor: string;
  atmosphere: number;
  atmosphereColor: string;
  nightLights: number;
  nightLightColor: string;
  rings: number;
  ringColor: string;
  roughness: number;
}

export interface Planet {
  id: string;
  name: string;
  type: PlanetType;
  position: THREE.Vector3;
  radius: number;
  faction: Faction;
  description: string;
  hyperlanes?: string[];
  climate?: string;
  terrain?: string;
  notable?: string[];
  nativeInhabitants?: string;
  systemId: string;
  factionControl?: Partial<Record<Faction, number>>;
  customColor?: string;
  customType?: string;
  appearance?: PlanetAppearance;
}
export interface StarSystem {
  id: string;
  name: string;
  position: THREE.Vector3;
  faction: Faction;
  planets: Planet[];
  starType: 'yellow' | 'red' | 'blue' | 'white' | 'binary';
  importance: 'capital' | 'major' | 'minor' | 'outpost';
  description: string;
  region: GalaxyRegion;
  isCustom?: boolean;
  customColor?: string;
  markerSize?: number;
}
export type GalaxyRegion =
  | 'deep_core'
  | 'core_worlds'
  | 'colonies'
  | 'inner_rim'
  | 'expansion_region'
  | 'mid_rim'
  | 'outer_rim'
  | 'unknown_regions';
export interface Fleet {
  id: string;
  name: string;
  faction: Faction;
  position: THREE.Vector3;
  shipCount: number;
  modelType: ShipModelType;
  markerSize?: number;
  flagship?: string;
  commander?: string;
  systemId?: string;
  isCustom?: boolean;
  composition?: FleetShipEntry[];
}
export interface FleetShipEntry {
  catalogId: string;
  name: string;
  shipClass: string;
  modelType: ShipModelType | null;
  quantity: number;
  isCustomEntry?: boolean;
}
export type InfoPanelData =
  | { type: 'system'; data: StarSystem }
  | { type: 'planet'; data: Planet }
  | { type: 'fleet'; data: Fleet };
export interface SearchResult {
  type: 'system' | 'planet' | 'fleet';
  id: string;
  name: string;
  parentName?: string;
  parentSystemId?: string;
}

export type UserRole = 'user' | 'galaxy_user' | 'admin' | 'bossman';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  galaxy_map_requested: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserManagementProfile {
  id: string;
  display_name: string;
  email: string | null;
  role: UserRole;
  galaxy_map_requested: boolean;
  created_at: string;
  updated_at: string;
  can_manage: boolean;
}

export type AuditAction =
  | 'system_created'
  | 'system_moved'
  | 'system_deleted'
  | 'system_resized'
  | 'fleet_created'
  | 'fleet_moved'
  | 'fleet_deleted'
  | 'fleet_resized'
  | 'fleet_updated'
  | 'planet_stats_updated'
  | 'role_changed'
  | 'timeline_changed'
  | 'display_name_changed'
  | 'email_changed'
  | 'password_changed'
  | 'account_deleted'
  | 'faction_created'
  | 'faction_updated'
  | 'faction_deleted';

export interface AuditLogEntry {
  id: number;
  user_id: string;
  action: AuditAction;
  entity_type: 'system' | 'fleet' | 'user' | 'faction';
  entity_id: string;
  entity_name: string;
  details: Record<string, unknown> | null;
  created_at: string;
  display_name?: string;
}

export interface PlanetStatsUpdate {
  hyperlanes?: string[] | null;
  faction?: Faction;
  factionControl?: Partial<Record<Faction, number>> | null;
  description?: string | null;
  climate?: string | null;
  terrain?: string | null;
  notable?: string[] | null;
  nativeInhabitants?: string | null;
  customColor?: string | null;
  customType?: string | null;
}
export interface FleetStatsUpdate {
  name?: string;
  shipCount?: number;
  faction?: Faction;
  modelType?: ShipModelType;
  commander?: string;
  composition?: FleetShipEntry[];
}
export interface GalaxySelectionStore {
  viewMode: ViewMode;
  selectedSystemId: string | null;
  selectedPlanetId: string | null;
  selectedFleetId: string | null;
  setSelectedSystem: (id: string | null) => void;
  setTopDownSelection: (systemId: string | null, planetId?: string | null) => void;
  setTopDownFleetSelection: (fleetId: string | null) => void;
  setSelectedPlanet: (id: string | null) => void;
  setSelectedFleet: (id: string | null) => void;
  infoPanelData: InfoPanelData | null;
  setInfoPanelData: (data: InfoPanelData | null) => void;
  resetCameraFlag: boolean;
  requestCameraReset: () => void;
  clearResetCameraFlag: () => void;
  zoomDelta: number;
  requestZoom: (delta: number) => void;
  clearZoomDelta: () => void;
}

export interface PendingCustomPlanet {
  name: string;
  color: string;
  faction: Faction;
  type: PlanetType;
  appearance: PlanetAppearance;
}

export interface GalaxyUIStore {
  showFleets: boolean;
  showLabels: boolean;
  showCivilianTraffic: boolean;
  toggleFleets: () => void;
  toggleLabels: () => void;
  toggleCivilianTraffic: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  factionFilters: FactionFilters;
  toggleFactionFilter: (faction: string) => void;
  syncFactionFilters: (factionIds: string[]) => void;
  placementMode: boolean;
  pendingCustomPlanet: PendingCustomPlanet | null;
  setPlacementMode: (mode: boolean, pending?: PendingCustomPlanet | null) => void;
  draggingCustomPlanet: boolean;
  setDraggingCustomPlanet: (dragging: boolean) => void;
  fleetPlacementMode: boolean;
  pendingCustomFleet: {
    name: string;
    faction: Faction;
    shipCount: number;
    modelType: ShipModelType;
    commander?: string;
    composition?: FleetShipEntry[];
  } | null;
  setFleetPlacementMode: (
    mode: boolean,
    pending?: {
      name: string;
      faction: Faction;
      shipCount: number;
      modelType: ShipModelType;
      commander?: string;
      composition?: FleetShipEntry[];
    } | null,
  ) => void;
  draggingCustomFleet: boolean;
  setDraggingCustomFleet: (dragging: boolean) => void;
}

export interface GalaxyDataStore {
  systems: StarSystem[];
  fleets: Fleet[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  initializeData: () => Promise<void>;
  applyRemoteSystemUpsert: (system: StarSystem) => void;
  applyRemoteSystemDelete: (id: string) => void;
  applyRemoteFleetUpsert: (fleet: Fleet) => void;
  applyRemoteFleetDelete: (id: string) => void;
  applyRemoteYear: (year: number) => void;
  updatePlanetStats: (systemId: string, planetId: string, stats: PlanetStatsUpdate) => void;
  addCustomSystem: (system: StarSystem) => void;
  removeCustomSystem: (id: string) => void;
  previewCustomSystemPosition: (id: string, position: THREE.Vector3) => void;
  updateCustomSystemPosition: (id: string, position: THREE.Vector3) => void;
  updateCustomSystemMarkerSize: (id: string, markerSize: number) => void;
  addCustomFleet: (fleet: Fleet) => void;
  removeCustomFleet: (id: string) => void;
  previewCustomFleetPosition: (id: string, position: THREE.Vector3) => void;
  updateCustomFleetPosition: (id: string, position: THREE.Vector3) => void;
  updateFleetMarkerSize: (id: string, markerSize: number) => void;
  updateFleetStats: (id: string, updates: FleetStatsUpdate) => void;
  getFilteredSystems: () => StarSystem[];
  getFactionStats: () => Record<string, { planets: number; fleets: number; shipUnits: number }>;
  dirtySystemIds: Set<string>;
  dirtyFleetIds: Set<string>;
  dirtyTimeline: boolean;
  hasPendingChanges: boolean;
  saveAllChanges: () => Promise<void>;
  discardAllChanges: () => Promise<void>;
}

export type NotificationType = 'article' | 'update';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  href: string;
  createdAt: string;
  read: boolean;
}
