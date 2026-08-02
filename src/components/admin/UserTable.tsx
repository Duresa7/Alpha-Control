import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ShieldCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ROLE_COLORS, ROLE_LABELS, formatDate, formatFullTime, getInitials } from './adminMeta';
import type { UserManagementProfile, UserRole } from '@/types';

type SortKey = 'name' | 'role' | 'joined';
type SortDir = 'asc' | 'desc';

const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  galaxy_user: 1,
  admin: 2,
  bossman: 3,
};

function RoleBadge({ role }: { role: UserRole }) {
  const color = ROLE_COLORS[role];
  return (
    <span
      className="adm-badge"
      style={{
        color,
        borderColor: `${color}55`,
        background: `${color}12`,
      }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function UserAvatar({ user }: { user: UserManagementProfile }) {
  const color = ROLE_COLORS[user.role];
  return (
    <span className="adm-avatar" style={{ color, borderColor: `${color}66` }} aria-hidden>
      {getInitials(user.display_name)}
    </span>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  return (
    <button
      type="button"
      className="adm-th-sort"
      onClick={() => onSort(sortKey)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {isActive ? (
        dir === 'asc' ? (
          <ArrowUp size={11} style={{ color: 'var(--adm-amber)' }} />
        ) : (
          <ArrowDown size={11} style={{ color: 'var(--adm-amber)' }} />
        )
      ) : (
        <ArrowUpDown size={11} style={{ opacity: 0.45 }} />
      )}
    </button>
  );
}

interface UserTableProps {
  users: UserManagementProfile[];
  pendingRequests: UserManagementProfile[];
  loading: boolean;
  isBossman: boolean;
  currentUserId: string | undefined;
  assignableRoles: UserRole[];
  roleUpdating: string | null;
  isFiltered: boolean;
  onRoleChange: (userId: string, role: UserRole) => void;
}

export function UserTable({
  users,
  pendingRequests,
  loading,
  isBossman,
  currentUserId,
  assignableRoles,
  roleUpdating,
  isFiltered,
  onRoleChange,
}: UserTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('joined');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'joined' ? 'desc' : 'asc');
    }
  };

  const sortedUsers = useMemo(() => {
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...users].sort((a, b) => {
      if (sortKey === 'name') {
        return a.display_name.localeCompare(b.display_name) * factor;
      }
      if (sortKey === 'role') {
        return (ROLE_RANK[a.role] - ROLE_RANK[b.role]) * factor;
      }
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * factor;
    });
  }, [users, sortKey, sortDir]);

  const colCount = isBossman ? 5 : 4;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5">
      {pendingRequests.length > 0 && (
        <section
          className="adm-card overflow-hidden"
          style={{ borderColor: 'rgba(146, 118, 27, 0.3)' }}
        >
          <header
            className="flex items-center justify-between gap-3 px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--adm-line-soft)' }}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={14} style={{ color: 'var(--adm-gold)' }} />
              <span className="adm-label" style={{ color: 'var(--adm-gold)' }}>
                Pending galaxy access requests
              </span>
            </div>
            <span className="adm-nav-badge">{pendingRequests.length}</span>
          </header>
          <ul role="list">
            {pendingRequests.map((user, index) => (
              <li
                key={user.id}
                className="flex items-center gap-3 px-4 py-2.5"
                style={index > 0 ? { borderTop: '1px solid var(--adm-line-soft)' } : undefined}
              >
                <UserAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{user.display_name}</p>
                  <p
                    className="adm-mono text-[11px]"
                    style={{ color: 'var(--adm-text-faint)' }}
                    title={formatFullTime(user.created_at)}
                  >
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  className="adm-btn adm-btn--primary"
                  disabled={roleUpdating === user.id}
                  onClick={() => onRoleChange(user.id, 'galaxy_user')}
                >
                  {roleUpdating === user.id ? 'Granting…' : 'Grant access'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="adm-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="adm-ticks" aria-hidden />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>
                  <SortHeader
                    label="Operator"
                    sortKey="name"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                {isBossman && <th>Email</th>}
                <th>
                  <SortHeader
                    label="Role"
                    sortKey="role"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th>
                  <SortHeader
                    label="Joined"
                    sortKey="joined"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} aria-hidden>
                    <td>
                      <span className="flex items-center gap-3">
                        <span className="adm-skeleton h-[30px] w-[30px] rounded-full" />
                        <span className="adm-skeleton h-3 w-28" />
                      </span>
                    </td>
                    {isBossman && (
                      <td>
                        <span className="adm-skeleton h-3 w-36" />
                      </td>
                    )}
                    <td>
                      <span className="adm-skeleton h-[21px] w-16" />
                    </td>
                    <td>
                      <span className="adm-skeleton h-3 w-20" />
                    </td>
                    <td />
                  </tr>
                ))
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={colCount}>
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                      <UsersIcon size={26} style={{ color: 'var(--adm-text-faint)' }} />
                      <p className="adm-label text-[11px]" style={{ color: 'var(--adm-text-dim)' }}>
                        {isFiltered
                          ? 'No personnel match the current filters'
                          : 'No personnel found'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <span className="truncate text-[13.5px] font-medium">
                          {user.display_name}
                        </span>
                      </span>
                    </td>
                    {isBossman && (
                      <td className="adm-mono text-[12px]" style={{ color: 'var(--adm-text-dim)' }}>
                        {user.email || 'Hidden'}
                      </td>
                    )}
                    <td>
                      <RoleBadge role={user.role} />
                    </td>
                    <td
                      className="adm-mono text-[12px]"
                      style={{ color: 'var(--adm-text-dim)' }}
                      title={formatFullTime(user.created_at)}
                    >
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {user.id === currentUserId ? (
                        <span className="adm-label">You</span>
                      ) : !user.can_manage ? (
                        <span className="adm-label">Restricted</span>
                      ) : (
                        <Popover
                          open={roleMenuFor === user.id}
                          onOpenChange={(open) => setRoleMenuFor(open ? user.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="adm-btn"
                              disabled={roleUpdating === user.id}
                            >
                              {roleUpdating === user.id ? (
                                'Updating…'
                              ) : (
                                <>
                                  Set role
                                  <ChevronDown size={12} />
                                </>
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="adm-menu">
                            <div className="adm-menu-label">Assign role</div>
                            {assignableRoles.map((role) => (
                              <button
                                key={role}
                                type="button"
                                className={cn(
                                  'adm-menu-item',
                                  role === user.role && 'adm-menu-item--active',
                                )}
                                onClick={() => {
                                  setRoleMenuFor(null);
                                  if (role !== user.role) {
                                    onRoleChange(user.id, role);
                                  }
                                }}
                              >
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ background: ROLE_COLORS[role] }}
                                  aria-hidden
                                />
                                <span className="flex-1">{ROLE_LABELS[role]}</span>
                                {role === user.role && <Check size={13} />}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
