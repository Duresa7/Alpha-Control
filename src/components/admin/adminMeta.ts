import type { AuditAction, UserRole } from '@/types';

export type ActionTone = 'create' | 'update' | 'delete' | 'move';

export const ACTION_LABELS: Record<string, string> = {
  system_created: 'Created System',
  system_moved: 'Moved System',
  system_deleted: 'Deleted System',
  system_resized: 'Resized System',
  fleet_created: 'Created Fleet',
  fleet_moved: 'Moved Fleet',
  fleet_deleted: 'Deleted Fleet',
  fleet_resized: 'Resized Fleet',
  fleet_updated: 'Updated Fleet',
  planet_stats_updated: 'Updated Planet',
  role_changed: 'Changed Role',
  timeline_changed: 'Updated Timeline',
  display_name_changed: 'Updated Display Name',
  email_changed: 'Updated Email',
  password_changed: 'Updated Password',
  account_deleted: 'Deleted Account',
  faction_created: 'Created Faction',
  faction_updated: 'Updated Faction',
  faction_deleted: 'Deleted Faction',
};

export const ACTION_GROUPS: { label: string; actions: string[] }[] = [
  {
    label: 'Systems',
    actions: ['system_created', 'system_moved', 'system_resized', 'system_deleted'],
  },
  {
    label: 'Fleets',
    actions: ['fleet_created', 'fleet_moved', 'fleet_resized', 'fleet_updated', 'fleet_deleted'],
  },
  {
    label: 'Planets & Factions',
    actions: ['planet_stats_updated', 'faction_created', 'faction_updated', 'faction_deleted'],
  },
  {
    label: 'Accounts',
    actions: [
      'role_changed',
      'display_name_changed',
      'email_changed',
      'password_changed',
      'account_deleted',
    ],
  },
  {
    label: 'Timeline',
    actions: ['timeline_changed'],
  },
];

export const ENTITY_LABELS: Record<string, string> = {
  system: 'System',
  fleet: 'Fleet',
  user: 'User',
  faction: 'Faction',
};

export const TONE_COLORS: Record<ActionTone, string> = {
  create: '#0e8a55',
  update: '#9a5b00',
  move: '#6d28d9',
  delete: '#c81e3c',
};

export function getActionTone(action: AuditAction): ActionTone {
  if (action.includes('deleted')) return 'delete';
  if (action.includes('created')) return 'create';
  if (action.includes('moved')) return 'move';
  return 'update';
}

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  galaxy_user: 'Galaxy User',
  admin: 'Admin',
  bossman: 'Bossman',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  user: '#6b7280',
  galaxy_user: '#7c3aed',
  admin: '#1a73e8',
  bossman: '#92761b',
};

export function formatFullTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const initials = parts.slice(0, 2).map((p) => p[0]);
  return initials.join('').toUpperCase();
}
