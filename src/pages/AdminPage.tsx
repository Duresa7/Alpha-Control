import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  ListFilter,
  Menu,
  Radar,
  RefreshCw,
  ScrollText,
  Search,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import {
  fetchAuditLogPage,
  fetchAuditLogTotal,
  fetchUserManagementProfiles,
  updateUserRole,
} from "@/data/supabaseStorage";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { UserTable } from "@/components/admin/UserTable";
import {
  ACTION_GROUPS,
  ACTION_LABELS,
  ROLE_COLORS,
  ROLE_LABELS,
  getInitials,
} from "@/components/admin/adminMeta";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AuditLogEntry, UserManagementProfile, UserRole } from "@/types";

const PAGE_SIZE = 40;

type TimeFilter = "" | "24h" | "7d" | "30d";

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  "": "All time",
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

function getSinceTimestamp(filter: TimeFilter): string | null {
  if (!filter) return null;
  const now = new Date();
  if (filter === "24h") now.setHours(now.getHours() - 24);
  else if (filter === "7d") now.setDate(now.getDate() - 7);
  else if (filter === "30d") now.setDate(now.getDate() - 30);
  return now.toISOString();
}

function matchesUser(user: UserManagementProfile, query: string): boolean {
  if (!query) return true;
  return [user.display_name, ROLE_LABELS[user.role], user.email ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function getAssignableRoles(isBossman: boolean): UserRole[] {
  return isBossman
    ? ["user", "galaxy_user", "admin", "bossman"]
    : ["user", "galaxy_user"];
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

interface AuditStats {
  total: number;
  last24h: number;
  last7d: number;
}

function Stat({
  label,
  value,
  accent,
  live,
}: {
  label: string;
  value: string;
  accent?: string;
  live?: boolean;
}) {
  return (
    <div className="adm-stat">
      <div className="mb-1 flex items-center gap-2">
        {live && <span className="adm-live-dot" aria-hidden />}
        <span className="adm-label">{label}</span>
      </div>
      <div className="adm-stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}

export function AdminPage() {
  const location = useLocation();
  const { profile: currentProfile } = useAuth();
  const { isAdmin, isBossman } = useRole();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);

  const [users, setUsers] = useState<UserManagementProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedAuditQuery, setDebouncedAuditQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isUsersView = location.pathname.startsWith("/admin/users");
  const isAuditView = !isUsersView;

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const profiles = await fetchUserManagementProfiles();
    setUsers(profiles);
    setUsersLoading(false);
  }, []);

  const loadAuditStats = useCallback(async () => {
    const day = new Date();
    day.setHours(day.getHours() - 24);
    const week = new Date();
    week.setDate(week.getDate() - 7);
    const [total, last24h, last7d] = await Promise.all([
      fetchAuditLogTotal(),
      fetchAuditLogTotal("", day.toISOString()),
      fetchAuditLogTotal("", week.toISOString()),
    ]);
    setAuditStats({ total, last24h, last7d });
  }, []);

  useEffect(() => {
    void loadAuditStats();
  }, [loadAuditStats]);

  useEffect(() => {
    if (isAdmin) void loadUsers();
  }, [isAdmin, loadUsers]);

  useEffect(() => {
    if (!isAuditView) {
      setDebouncedAuditQuery("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextQuery = searchInput.trim();
      setDebouncedAuditQuery((prevQuery) => {
        if (prevQuery !== nextQuery) setLogPage(0);
        return nextQuery;
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isAuditView, searchInput]);

  const sinceTimestamp = useMemo(
    () => getSinceTimestamp(timeFilter),
    [timeFilter],
  );
  const actionArg = actionFilter || null;

  useEffect(() => {
    if (!isAuditView) return;
    let cancelled = false;

    async function loadAuditLogs() {
      setLogsLoading(true);
      const offset = logPage * PAGE_SIZE;

      if (logPage === 0) {
        const [fetchedLogs, total] = await Promise.all([
          fetchAuditLogPage(
            PAGE_SIZE,
            offset,
            debouncedAuditQuery,
            sinceTimestamp,
            actionArg,
          ),
          fetchAuditLogTotal(debouncedAuditQuery, sinceTimestamp, actionArg),
        ]);
        if (!cancelled) {
          setLogs(fetchedLogs);
          setLogTotal(total);
          setLogsLoading(false);
        }
        return;
      }

      const fetchedLogs = await fetchAuditLogPage(
        PAGE_SIZE,
        offset,
        debouncedAuditQuery,
        sinceTimestamp,
        actionArg,
      );
      if (!cancelled) {
        setLogs(fetchedLogs);
        setLogsLoading(false);
      }
    }

    loadAuditLogs();
    return () => {
      cancelled = true;
    };
  }, [isAuditView, logPage, debouncedAuditQuery, sinceTimestamp, actionArg]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    setSearchInput("");
    setDebouncedAuditQuery("");
    setTimeFilter("");
    setActionFilter("");
    setRoleFilter("");
    setLogPage(0);
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const searchQuery = searchInput.trim().toLowerCase();
  const isSearchActive = searchQuery.length > 0;
  const isAuditSearchActive = debouncedAuditQuery.length > 0;
  const isAuditFiltered = isAuditSearchActive || !!timeFilter || !!actionFilter;

  const handleAuditRefresh = useCallback(async () => {
    if (!isAuditView) return;
    setLogsLoading(true);
    const [fetchedLogs, total] = await Promise.all([
      fetchAuditLogPage(
        PAGE_SIZE,
        logPage * PAGE_SIZE,
        debouncedAuditQuery,
        sinceTimestamp,
        actionArg,
      ),
      fetchAuditLogTotal(debouncedAuditQuery, sinceTimestamp, actionArg),
      loadAuditStats(),
    ]);
    setLogs(fetchedLogs);
    setLogTotal(total);
    setLogsLoading(false);
  }, [
    isAuditView,
    logPage,
    debouncedAuditQuery,
    sinceTimestamp,
    actionArg,
    loadAuditStats,
  ]);

  const handleExportCsv = useCallback(() => {
    if (logs.length === 0) return;
    const header = [
      "id",
      "timestamp",
      "action",
      "entity_type",
      "entity_name",
      "entity_id",
      "operator",
      "details",
    ];
    const rows = logs.map((log) =>
      [
        log.id,
        log.created_at,
        log.action,
        log.entity_type,
        log.entity_name,
        log.entity_id,
        log.display_name ?? "",
        log.details ? JSON.stringify(log.details) : "",
      ]
        .map(csvEscape)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audit-log-page-${logPage + 1}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [logs, logPage]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!currentProfile) return;
    setRoleUpdating(userId);
    const { error } = await updateUserRole(userId, newRole);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: newRole,
                galaxy_map_requested:
                  newRole === "user" ? u.galaxy_map_requested : false,
              }
            : u,
        ),
      );
    }
    setRoleUpdating(null);
  };

  const usersToRender = users.filter(
    (user) =>
      matchesUser(user, searchQuery) &&
      (!roleFilter || user.role === roleFilter),
  );
  const pendingRequests = users.filter(
    (u) => u.galaxy_map_requested && u.role === "user",
  );
  const assignableRoles = getAssignableRoles(isBossman);

  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      user: 0,
      galaxy_user: 0,
      admin: 0,
      bossman: 0,
    };
    for (const u of users) counts[u.role] += 1;
    return counts;
  }, [users]);

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <div
      className={cn("admin-page", isDrawerOpen && "admin-page--drawer-open")}
    >
      <div
        className="adm-overlay"
        onClick={closeDrawer}
        aria-hidden={!isDrawerOpen}
      />
      <div className="adm-shell">
        <aside className="adm-sidebar">
          <div className="adm-brand">
            <span className="adm-brand-mark" aria-hidden>
              <Radar size={16} />
            </span>
            <div>
              <div className="adm-brand-title">Holonet</div>
              <div className="adm-brand-sub">Records Terminal</div>
            </div>
          </div>

          <div className="adm-side-label">Console</div>
          <nav
            className="flex flex-col gap-0.5"
            aria-label="Admin navigation"
          >
            <NavLink
              to="/admin/audit"
              className="adm-nav-item"
              onClick={closeDrawer}
            >
              <ScrollText size={15} />
              <span>Audit Feed</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              className="adm-nav-item"
              onClick={closeDrawer}
            >
              <UsersIcon size={15} />
              <span>Personnel</span>
              {pendingRequests.length > 0 && (
                <span
                  className="adm-nav-badge"
                  title={`${pendingRequests.length} pending galaxy access request${pendingRequests.length === 1 ? "" : "s"}`}
                >
                  {pendingRequests.length}
                </span>
              )}
            </NavLink>
          </nav>

          <div className="mt-auto flex flex-col gap-2.5">
            {currentProfile && (
              <div className="adm-identity">
                <span
                  className="adm-avatar"
                  style={{
                    color: ROLE_COLORS[currentProfile.role],
                    borderColor: `${ROLE_COLORS[currentProfile.role]}66`,
                  }}
                  aria-hidden
                >
                  {getInitials(currentProfile.display_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">
                    {currentProfile.display_name}
                  </p>
                  <p
                    className="adm-label"
                    style={{ color: ROLE_COLORS[currentProfile.role] }}
                  >
                    {ROLE_LABELS[currentProfile.role]}
                  </p>
                </div>
              </div>
            )}
            <NavLink
              to="/map"
              className="adm-btn justify-center"
              onClick={closeDrawer}
            >
              <ArrowLeft size={13} />
              Exit to Map
            </NavLink>
          </div>
        </aside>

        <main className="adm-main">
          <header className="adm-header">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="adm-btn adm-btn--icon adm-menu-toggle"
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={isDrawerOpen}
              >
                <Menu size={15} />
              </button>
              <div className="min-w-0">
                <p className="adm-eyebrow">Holonet // Admin Control</p>
                <h1 className="adm-title">
                  {isUsersView ? "Personnel" : "Audit Feed"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="adm-btn"
                onClick={() =>
                  isAuditView ? void handleAuditRefresh() : void loadUsers()
                }
                disabled={isAuditView ? logsLoading : usersLoading}
              >
                <RefreshCw
                  size={13}
                  className={
                    (isAuditView ? logsLoading : usersLoading)
                      ? "animate-spin"
                      : undefined
                  }
                />
                <span className="max-sm:hidden">Refresh</span>
              </button>
              {isAuditView && (
                <button
                  type="button"
                  className="adm-btn"
                  onClick={handleExportCsv}
                  disabled={logsLoading || logs.length === 0}
                  title="Export the current page as CSV"
                >
                  <Download size={13} />
                  <span className="max-sm:hidden">Export</span>
                </button>
              )}
            </div>
          </header>

          <div className="adm-body">
            {isAuditView ? (
              <>
                <section className="adm-card overflow-hidden">
                  <div className="adm-ticks" aria-hidden />
                  <div className="adm-stat-strip">
                    <Stat
                      label="Feed Live"
                      value={auditStats ? auditStats.total.toLocaleString() : "—"}
                      live
                    />
                    <Stat
                      label="Last 24 Hours"
                      value={
                        auditStats ? auditStats.last24h.toLocaleString() : "—"
                      }
                    />
                    <Stat
                      label="Last 7 Days"
                      value={
                        auditStats ? auditStats.last7d.toLocaleString() : "—"
                      }
                    />
                    {isAuditFiltered && (
                      <Stat
                        label="Matching Filters"
                        value={logsLoading ? "—" : logTotal.toLocaleString()}
                        accent="var(--adm-accent)"
                      />
                    )}
                  </div>
                </section>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label
                    className="adm-input-wrap min-w-[200px] flex-1"
                    htmlFor="admin-search"
                  >
                    <Search size={14} />
                    <input
                      id="admin-search"
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search records, operators, entities…"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput("")}
                        aria-label="Clear search"
                        className="inline-flex cursor-pointer items-center border-0 bg-transparent p-0"
                        style={{ color: "var(--adm-text-faint)" }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </label>

                  <div className="adm-seg" role="group" aria-label="Time range">
                    {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map(
                      (key) => (
                        <button
                          key={key}
                          type="button"
                          className={cn(
                            "adm-seg-btn",
                            timeFilter === key && "adm-seg-btn--active",
                          )}
                          onClick={() => {
                            setTimeFilter(key);
                            setLogPage(0);
                          }}
                        >
                          {TIME_FILTER_LABELS[key]}
                        </button>
                      ),
                    )}
                  </div>

                  <Popover open={actionMenuOpen} onOpenChange={setActionMenuOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "adm-btn h-[34px]",
                          actionFilter && "adm-btn--primary",
                        )}
                      >
                        <ListFilter size={13} />
                        {actionFilter
                          ? ACTION_LABELS[actionFilter]
                          : "All actions"}
                        <ChevronDown size={12} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="adm-menu">
                      <button
                        type="button"
                        className={cn(
                          "adm-menu-item",
                          !actionFilter && "adm-menu-item--active",
                        )}
                        onClick={() => {
                          setActionFilter("");
                          setLogPage(0);
                          setActionMenuOpen(false);
                        }}
                      >
                        <span className="flex-1">All actions</span>
                        {!actionFilter && <Check size={13} />}
                      </button>
                      {ACTION_GROUPS.map((group) => (
                        <div key={group.label}>
                          <div className="adm-menu-label">{group.label}</div>
                          {group.actions.map((action) => (
                            <button
                              key={action}
                              type="button"
                              className={cn(
                                "adm-menu-item",
                                actionFilter === action &&
                                  "adm-menu-item--active",
                              )}
                              onClick={() => {
                                setActionFilter(action);
                                setLogPage(0);
                                setActionMenuOpen(false);
                              }}
                            >
                              <span className="flex-1">
                                {ACTION_LABELS[action]}
                              </span>
                              {actionFilter === action && <Check size={13} />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {isAuditFiltered && (
                  <div className="flex flex-wrap items-center gap-2">
                    {isAuditSearchActive && (
                      <span className="adm-chip">
                        “{debouncedAuditQuery}”
                        <button
                          type="button"
                          onClick={() => setSearchInput("")}
                          aria-label="Clear search filter"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    {timeFilter && (
                      <span className="adm-chip">
                        {timeFilter === "24h"
                          ? "Last 24 hours"
                          : timeFilter === "7d"
                            ? "Last 7 days"
                            : "Last 30 days"}
                        <button
                          type="button"
                          onClick={() => {
                            setTimeFilter("");
                            setLogPage(0);
                          }}
                          aria-label="Clear time filter"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    {actionFilter && (
                      <span className="adm-chip">
                        {ACTION_LABELS[actionFilter]}
                        <button
                          type="button"
                          onClick={() => {
                            setActionFilter("");
                            setLogPage(0);
                          }}
                          aria-label="Clear action filter"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    )}
                    <button
                      type="button"
                      className="adm-btn h-[26px] border-0 bg-transparent px-2"
                      onClick={() => {
                        setSearchInput("");
                        setTimeFilter("");
                        setActionFilter("");
                        setLogPage(0);
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <AuditLogTable
                  logs={logs}
                  loading={logsLoading}
                  total={logTotal}
                  page={logPage}
                  pageSize={PAGE_SIZE}
                  isFiltered={isAuditFiltered}
                  isSearchActive={isAuditSearchActive}
                  onPageChange={setLogPage}
                />
              </>
            ) : !isAdmin ? (
              <p className="adm-label py-8 text-center">
                Only admins can access personnel management.
              </p>
            ) : (
              <>
                <section className="adm-card overflow-hidden">
                  <div className="adm-ticks" aria-hidden />
                  <div className="adm-stat-strip">
                    <Stat
                      label="Personnel"
                      value={usersLoading ? "—" : users.length.toLocaleString()}
                      live
                    />
                    <Stat
                      label="Galaxy Users"
                      value={
                        usersLoading
                          ? "—"
                          : roleCounts.galaxy_user.toLocaleString()
                      }
                    />
                    <Stat
                      label="Admins"
                      value={
                        usersLoading
                          ? "—"
                          : (
                              roleCounts.admin + roleCounts.bossman
                            ).toLocaleString()
                      }
                    />
                    <Stat
                      label="Pending Requests"
                      value={
                        usersLoading
                          ? "—"
                          : pendingRequests.length.toLocaleString()
                      }
                      accent={
                        pendingRequests.length > 0
                          ? "var(--adm-gold)"
                          : undefined
                      }
                    />
                  </div>
                </section>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label
                    className="adm-input-wrap min-w-[200px] flex-1"
                    htmlFor="admin-search"
                  >
                    <Search size={14} />
                    <input
                      id="admin-search"
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search personnel…"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput("")}
                        aria-label="Clear search"
                        className="inline-flex cursor-pointer items-center border-0 bg-transparent p-0"
                        style={{ color: "var(--adm-text-faint)" }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </label>

                  <div className="adm-seg" role="group" aria-label="Role filter">
                    <button
                      type="button"
                      className={cn(
                        "adm-seg-btn",
                        !roleFilter && "adm-seg-btn--active",
                      )}
                      onClick={() => setRoleFilter("")}
                    >
                      All · {users.length}
                    </button>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={cn(
                          "adm-seg-btn",
                          roleFilter === role && "adm-seg-btn--active",
                        )}
                        onClick={() =>
                          setRoleFilter((prev) => (prev === role ? "" : role))
                        }
                      >
                        {ROLE_LABELS[role]} · {roleCounts[role]}
                      </button>
                    ))}
                  </div>
                </div>

                <UserTable
                  users={usersToRender}
                  pendingRequests={pendingRequests}
                  loading={usersLoading}
                  isBossman={isBossman}
                  currentUserId={currentProfile?.id}
                  assignableRoles={assignableRoles}
                  roleUpdating={roleUpdating}
                  isFiltered={isSearchActive || !!roleFilter}
                  onRoleChange={handleRoleChange}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
