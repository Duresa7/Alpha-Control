import * as THREE from 'three';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { withTimeout } from '@/utils/withTimeout';
import { logger } from '@/utils/logger';
import type {
  StarSystem,
  Fleet,
  Faction,
  Planet,
  AuditAction,
  AuditLogEntry,
  UserManagementProfile,
  ShipModelType,
  FactionConfig,
  FleetShipEntry,
} from '@/types';

const AUTH_LOOKUP_TIMEOUT_MS = 8_000;

export const getAuthenticatedUserId = async (): Promise<string | null> => {
  if (!supabaseConfigured) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_LOOKUP_TIMEOUT_MS,
      'Auth user lookup timed out.',
    );
    if (error) {
      logger.error('Failed to resolve auth user:', error);
      return null;
    }
    return data.user?.id ?? null;
  } catch (error) {
    logger.error('Failed to resolve auth user:', error);
    return null;
  }
};

interface DbSystem {
  id: string;
  name: string;
  position_x: number;
  position_y: number;
  position_z: number;
  custom_color: string | null;
  marker_size: number | null;
  planets: DbPlanet[];
  created_by: string | null;
}

interface DbPlanet {
  id: string;
  name: string;
  type: string;
  radius: number;
  faction: Faction;
  description: string;
  hyperlanes?: string[];
  climate?: string;
  terrain?: string;
  notable?: string[];
  nativeInhabitants?: string;
  factionControl?: Partial<Record<Faction, number>>;
  customColor?: string;
  customType?: string;
}

const sanitizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
};

interface DbFleet {
  id: string;
  name: string;
  position_x: number;
  position_y: number;
  position_z: number;
  faction: Faction;
  ship_count: number;
  model_type: ShipModelType;
  marker_size: number | null;
  commander: string | null;
  composition: FleetShipEntry[];
  created_by: string | null;
}

function dbToSystem(row: DbSystem): StarSystem {
  const planets: Planet[] =
    Array.isArray(row.planets) && row.planets.length > 0
      ? row.planets.map((p, i) => ({
          id: p.id || `${row.id}${i === 0 ? '-prime' : `-planet-${i + 1}`}`,
          name: p.name || row.name,
          type: (p.type || 'terrestrial') as Planet['type'],
          position: new THREE.Vector3(0, 0, 0),
          radius: typeof p.radius === 'number' ? p.radius : 1,
          faction: p.faction || 'neutral',
          description: p.description || `Custom planet: ${p.name || row.name}`,
          hyperlanes: sanitizeStringArray(p.hyperlanes),
          climate: p.climate,
          terrain: p.terrain,
          notable: p.notable,
          nativeInhabitants: p.nativeInhabitants,
          systemId: row.id,
          factionControl: p.factionControl,
          customColor: p.customColor,
          customType: p.customType,
        }))
      : [
          {
            id: `${row.id}-prime`,
            name: row.name,
            type: 'terrestrial' as const,
            position: new THREE.Vector3(0, 0, 0),
            radius: 1,
            faction: 'neutral' as const,
            description: `Custom planet: ${row.name}`,
            systemId: row.id,
          },
        ];

  return {
    id: row.id,
    name: row.name,
    position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
    faction: planets[0]?.faction || 'neutral',
    starType: 'white',
    importance: 'minor',
    description: planets[0]?.description || `Custom planet: ${row.name}`,
    region: 'unknown_regions',
    isCustom: true,
    customColor: row.custom_color || '#FFFFFF',
    markerSize: row.marker_size ?? undefined,
    planets,
  };
}

function dbToFleet(row: DbFleet): Fleet {
  const composition =
    Array.isArray(row.composition) && row.composition.length > 0 ? row.composition : undefined;
  return {
    id: row.id,
    name: row.name,
    position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
    faction: row.faction,
    shipCount: row.ship_count,
    modelType: row.model_type,
    markerSize: row.marker_size ?? undefined,
    commander: row.commander ?? undefined,
    isCustom: true,
    composition,
  };
}

function serializeSystemForDb(system: StarSystem, userId: string) {
  return {
    id: system.id,
    name: system.name,
    position_x: system.position.x,
    position_y: system.position.y,
    position_z: system.position.z,
    custom_color: system.customColor || null,
    marker_size: system.markerSize ?? null,
    planets: system.planets.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      radius: p.radius,
      faction: p.faction,
      description: p.description,
      ...(Array.isArray(p.hyperlanes) && p.hyperlanes.length > 0
        ? { hyperlanes: p.hyperlanes }
        : {}),
      climate: p.climate,
      terrain: p.terrain,
      notable: p.notable,
      nativeInhabitants: p.nativeInhabitants,
      factionControl: p.factionControl,
      customColor: p.customColor,
      customType: p.customType,
    })),
    created_by: userId,
  };
}

function serializeFleetForDb(fleet: Fleet, userId: string) {
  return {
    id: fleet.id,
    name: fleet.name,
    position_x: fleet.position.x,
    position_y: fleet.position.y,
    position_z: fleet.position.z,
    faction: fleet.faction,
    ship_count: fleet.shipCount,
    model_type: fleet.modelType,
    marker_size: fleet.markerSize ?? null,
    commander: fleet.commander?.trim() || null,
    composition: fleet.composition ?? [],
    created_by: userId,
  };
}

export async function loadCustomSystems(): Promise<StarSystem[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from('custom_systems').select('*');
  if (error) {
    logger.error('Failed to load custom systems:', error);
    return [];
  }
  return (data as DbSystem[]).map(dbToSystem);
}

export async function insertCustomSystem(system: StarSystem, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase
    .from('custom_systems')
    .insert(serializeSystemForDb(system, userId));
  if (error) {
    logger.error('Failed to insert custom system:', error);
    throw error;
  }
}

export async function upsertSystem(system: StarSystem, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase
    .from('custom_systems')
    .upsert(serializeSystemForDb(system, userId), { onConflict: 'id' });
  if (error) {
    logger.error('Failed to upsert system:', error);
    throw error;
  }
}

export async function batchUpsertSystems(systems: StarSystem[], userId: string): Promise<void> {
  if (!supabaseConfigured || systems.length === 0) return;
  const rows = systems.map((s) => serializeSystemForDb(s, userId));
  const { error } = await supabase.from('custom_systems').upsert(rows, { onConflict: 'id' });
  if (error) {
    logger.error('Failed to batch upsert systems:', error);
    throw error;
  }
}

export async function deleteCustomSystem(id: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_systems').delete().eq('id', id);
  if (error) {
    logger.error('Failed to delete custom system:', error);
    throw error;
  }
}

export async function loadCustomFleets(): Promise<Fleet[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from('custom_fleets').select('*');
  if (error) {
    logger.error('Failed to load custom fleets:', error);
    return [];
  }
  return (data as DbFleet[]).map(dbToFleet);
}

export async function insertCustomFleet(fleet: Fleet, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_fleets').insert(serializeFleetForDb(fleet, userId));
  if (error) {
    logger.error('Failed to insert custom fleet:', error);
    throw error;
  }
}

export async function upsertFleet(fleet: Fleet, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase
    .from('custom_fleets')
    .upsert(serializeFleetForDb(fleet, userId), { onConflict: 'id' });
  if (error) {
    logger.error('Failed to upsert fleet:', error);
    throw error;
  }
}

export async function batchUpsertFleets(fleets: Fleet[], userId: string): Promise<void> {
  if (!supabaseConfigured || fleets.length === 0) return;
  const rows = fleets.map((f) => serializeFleetForDb(f, userId));
  const { error } = await supabase.from('custom_fleets').upsert(rows, { onConflict: 'id' });
  if (error) {
    logger.error('Failed to batch upsert fleets:', error);
    throw error;
  }
}

export async function deleteCustomFleet(id: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_fleets').delete().eq('id', id);
  if (error) {
    logger.error('Failed to delete custom fleet:', error);
    throw error;
  }
}

export async function loadSetting(key: string): Promise<unknown> {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error) {
    logger.error(`Failed to load setting "${key}":`, error);
    return null;
  }
  return data?.value ?? null;
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  if (!supabaseConfigured) return;
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from('app_settings')
    .update({ value: value as never, updated_by: userId })
    .eq('key', key);
  if (error) {
    logger.error(`Failed to update setting "${key}":`, error);
    throw error;
  }
}

export async function logAction(
  action: AuditAction,
  entityType: 'system' | 'fleet' | 'user' | 'faction',
  entityId: string,
  entityName: string,
  details?: Record<string, unknown>,
): Promise<void> {
  if (!supabaseConfigured) return;
  const userId = await getAuthenticatedUserId();
  if (!userId) return;
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details: details ?? null,
  });
  if (error) logger.error('Failed to log audit action:', error);
}

function mapAuditLogRow(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: Number(row.id),
    user_id: row.user_id as string,
    action: row.action as AuditAction,
    entity_type: row.entity_type as 'system' | 'fleet' | 'user' | 'faction',
    entity_id: row.entity_id as string,
    entity_name: row.entity_name as string,
    details: row.details as Record<string, unknown> | null,
    created_at: row.created_at as string,
    display_name: (row.display_name as string | null) ?? undefined,
  };
}

export async function fetchAuditLogPage(
  limit = 40,
  offset = 0,
  query = '',
  since: string | null = null,
  action: string | null = null,
): Promise<AuditLogEntry[]> {
  if (!supabaseConfigured) return [];
  const normalizedQuery = query.trim();
  const { data, error } = await supabase.rpc('fetch_audit_logs_page', {
    p_limit: limit,
    p_offset: offset,
    p_query: normalizedQuery.length > 0 ? normalizedQuery : null,
    p_since: since ?? null,
    p_action: action ?? null,
  });

  if (error) {
    logger.error('Failed to fetch audit log page:', error);
    return [];
  }

  const rows = (data || []) as Record<string, unknown>[];
  return rows.map(mapAuditLogRow);
}

export async function fetchAuditLogTotal(
  query = '',
  since: string | null = null,
  action: string | null = null,
): Promise<number> {
  if (!supabaseConfigured) return 0;
  const normalizedQuery = query.trim();
  const { data, error } = await supabase.rpc('fetch_audit_logs_total', {
    p_query: normalizedQuery.length > 0 ? normalizedQuery : null,
    p_since: since ?? null,
    p_action: action ?? null,
  });

  if (error) {
    logger.error('Failed to fetch audit log total:', error);
    return 0;
  }

  const raw = Array.isArray(data) ? data[0] : data;
  const candidate =
    raw && typeof raw === 'object' ? Object.values(raw as Record<string, unknown>)[0] : raw;
  const total = Number(candidate ?? 0);
  return Number.isFinite(total) ? total : 0;
}

function mapUserManagementRow(row: Record<string, unknown>): UserManagementProfile {
  return {
    id: row.id as string,
    display_name: row.display_name as string,
    email: (row.email as string | null) ?? null,
    role: row.role as UserManagementProfile['role'],
    galaxy_map_requested: Boolean(row.galaxy_map_requested),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    can_manage: Boolean(row.can_manage),
  };
}

export async function fetchUserManagementProfiles(): Promise<UserManagementProfile[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.rpc('fetch_user_management_profiles');

  if (error) {
    logger.error('Failed to fetch user management profiles:', error);
    return [];
  }

  const rows = (data || []) as Record<string, unknown>[];
  return rows.map(mapUserManagementRow);
}

export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  try {
    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });
    if (error) {
      return { error: error.message || 'Delete failed' };
    }
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to delete account',
    };
  }
}

export async function updateUserRole(
  userId: string,
  role: 'user' | 'galaxy_user' | 'admin' | 'bossman',
): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  const { error } = await supabase.rpc('set_user_role', {
    p_user_id: userId,
    p_role: role,
  });

  if (error) return { error: error.message };
  return { error: null };
}

interface DbFaction {
  id: string;
  label: string;
  marker_color: string;
  bar_color: string;
  sort_order: number;
  is_builtin: boolean;
}

function dbToFactionConfig(row: DbFaction): FactionConfig {
  return {
    id: row.id,
    label: row.label,
    markerColor: row.marker_color,
    barColor: row.bar_color,
    sortOrder: row.sort_order,
    isBuiltin: row.is_builtin,
  };
}

export async function loadFactions(): Promise<FactionConfig[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from('custom_factions')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    logger.error('Failed to load factions:', error);
    return [];
  }
  return (data as DbFaction[]).map(dbToFactionConfig);
}

export async function upsertFaction(faction: FactionConfig, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_factions').upsert(
    {
      id: faction.id,
      label: faction.label,
      marker_color: faction.markerColor,
      bar_color: faction.barColor,
      sort_order: faction.sortOrder,
      is_builtin: faction.isBuiltin,
      created_by: userId,
    },
    { onConflict: 'id' },
  );
  if (error) {
    logger.error('Failed to upsert faction:', error);
    throw error;
  }
}

export async function updateFactionInDb(
  id: string,
  updates: Partial<Pick<FactionConfig, 'label' | 'markerColor' | 'barColor' | 'sortOrder'>>,
): Promise<void> {
  if (!supabaseConfigured) return;
  const dbUpdates: Record<string, unknown> = {};
  if (updates.label !== undefined) dbUpdates.label = updates.label;
  if (updates.markerColor !== undefined) dbUpdates.marker_color = updates.markerColor;
  if (updates.barColor !== undefined) dbUpdates.bar_color = updates.barColor;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  const { error } = await supabase.from('custom_factions').update(dbUpdates).eq('id', id);
  if (error) {
    logger.error('Failed to update faction:', error);
    throw error;
  }
}

export async function deleteFactionFromDb(id: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_factions').delete().eq('id', id);
  if (error) {
    logger.error('Failed to delete faction:', error);
    throw error;
  }
}
