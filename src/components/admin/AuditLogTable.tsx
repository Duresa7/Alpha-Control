import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  ScrollText,
} from 'lucide-react';
import { useState } from 'react';
import {
  ACTION_LABELS,
  ENTITY_LABELS,
  TONE_COLORS,
  formatFullTime,
  formatRelativeTime,
  getActionTone,
} from './adminMeta';
import type { AuditLogEntry } from '@/types';

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface AuditLogRowProps {
  log: AuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
}

function AuditLogRow({ log, expanded, onToggle }: AuditLogRowProps) {
  const [copied, setCopied] = useState(false);
  const tone = getActionTone(log.action);
  const detailEntries = log.details ? Object.entries(log.details) : [];
  const entityLabel = ENTITY_LABELS[log.entity_type] ?? log.entity_type;
  const actionLabel = ACTION_LABELS[log.action] ?? log.action;

  const handleCopyId = async () => {
    if (!log.entity_id) return;
    try {
      await navigator.clipboard.writeText(log.entity_id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <li className="adm-audit-row" style={{ borderLeftColor: `${TONE_COLORS[tone]}77` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="adm-audit-summary adm-audit-grid"
      >
        <motion.span
          aria-hidden
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="inline-flex items-center justify-center"
          style={{ color: 'var(--adm-text-faint)' }}
        >
          <ChevronDown size={14} />
        </motion.span>

        <time
          className="adm-audit-col-time adm-mono text-[11.5px]"
          style={{ color: 'var(--adm-text-dim)' }}
          dateTime={log.created_at}
          title={formatFullTime(log.created_at)}
        >
          {formatRelativeTime(log.created_at)}
        </time>

        <span>
          <span className={`adm-badge adm-badge--${tone}`}>{actionLabel}</span>
        </span>

        <span className="adm-audit-col-entity adm-label">{entityLabel}</span>

        <span className="truncate text-[13.5px]" title={log.entity_name || undefined}>
          {log.entity_name || '—'}
        </span>

        <span
          className="adm-audit-col-user truncate text-[12.5px]"
          style={{ color: 'var(--adm-text-dim)' }}
          title={log.display_name || 'Unknown'}
        >
          {log.display_name || 'Unknown'}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="adm-audit-details">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
                <div>
                  <p className="adm-label mb-1">Operator</p>
                  <p className="text-[13px]">{log.display_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="adm-label mb-1">Entity</p>
                  <p className="text-[13px]">
                    {entityLabel}
                    {log.entity_name ? ` · ${log.entity_name}` : ''}
                  </p>
                </div>
                <div>
                  <p className="adm-label mb-1">Timestamp</p>
                  <p className="adm-mono text-[12px]">{formatFullTime(log.created_at)}</p>
                </div>
                <div>
                  <p className="adm-label mb-1">Entity ID</p>
                  <p className="flex items-center gap-1.5">
                    <span
                      className="adm-mono truncate text-[12px]"
                      style={{ color: 'var(--adm-text-dim)' }}
                      title={log.entity_id || undefined}
                    >
                      {log.entity_id || '—'}
                    </span>
                    {log.entity_id && (
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="adm-btn adm-btn--icon h-[22px] w-[22px] shrink-0"
                        aria-label="Copy entity ID"
                        title="Copy entity ID"
                      >
                        {copied ? (
                          <Check size={11} style={{ color: 'var(--adm-success)' }} />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    )}
                  </p>
                </div>
              </div>

              {detailEntries.length > 0 && (
                <div className="mt-4">
                  <p className="adm-label mb-1.5">Details</p>
                  <dl className="adm-card overflow-hidden">
                    {detailEntries.map(([key, value]) => (
                      <div className="adm-detail-item" key={key}>
                        <dt
                          className="adm-mono text-[11.5px]"
                          style={{ color: 'var(--adm-text-faint)' }}
                        >
                          {key}
                        </dt>
                        <dd className="min-w-0 break-words text-[12.5px]">
                          {formatDetailValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <p className="adm-mono mt-4 text-[10.5px]" style={{ color: 'var(--adm-text-faint)' }}>
                event:{log.action} · id:{log.id}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function SkeletonRows() {
  return (
    <div aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="adm-audit-grid px-4 py-[13px]"
          style={{ borderBottom: '1px solid var(--adm-line-soft)' }}
        >
          <span />
          <span className="adm-skeleton adm-audit-col-time h-3 w-12" />
          <span className="adm-skeleton h-[21px] w-28" />
          <span className="adm-skeleton adm-audit-col-entity h-3 w-14" />
          <span className="adm-skeleton h-3 w-2/5" />
          <span className="adm-skeleton adm-audit-col-user h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  isFiltered: boolean;
  isSearchActive: boolean;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({
  logs,
  loading,
  total,
  page,
  pageSize,
  isFiltered,
  isSearchActive,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeFrom = total === 0 ? 0 : page * pageSize + 1;
  const rangeTo = Math.min(total, page * pageSize + logs.length);

  return (
    <section className="adm-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="adm-ticks" aria-hidden />

      <div className="adm-audit-grid adm-audit-head adm-label">
        <span aria-hidden />
        <span className="adm-audit-col-time">Time</span>
        <span>Action</span>
        <span className="adm-audit-col-entity">Entity</span>
        <span>Record</span>
        <span className="adm-audit-col-user">Operator</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonRows />
        ) : logs.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
            <ScrollText size={26} style={{ color: 'var(--adm-text-faint)' }} />
            <p className="adm-label text-[11px]" style={{ color: 'var(--adm-text-dim)' }}>
              {isSearchActive || isFiltered
                ? 'No records match the current filters'
                : 'No records logged yet'}
            </p>
            {(isSearchActive || isFiltered) && (
              <p className="max-w-[340px] text-[12.5px]" style={{ color: 'var(--adm-text-faint)' }}>
                Adjust or clear the filters above to see more of the feed.
              </p>
            )}
          </div>
        ) : (
          <ul role="list">
            {logs.map((log) => (
              <AuditLogRow
                key={log.id}
                log={log}
                expanded={expandedId === log.id}
                onToggle={() => setExpandedId((current) => (current === log.id ? null : log.id))}
              />
            ))}
          </ul>
        )}
      </div>

      <footer
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
        style={{ borderTop: '1px solid var(--adm-line-soft)' }}
      >
        <span className="adm-label">
          {total === 0 ? 'No records' : `Showing ${rangeFrom}–${rangeTo} of ${total}`}
          {isFiltered && total > 0 ? ' · filtered' : ''}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="adm-btn adm-btn--icon"
            disabled={page === 0 || loading}
            onClick={() => onPageChange(0)}
            aria-label="First page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--icon"
            disabled={page === 0 || loading}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="adm-mono px-2 text-[11.5px]" style={{ color: 'var(--adm-text-dim)' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn--icon"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--icon"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => onPageChange(totalPages - 1)}
            aria-label="Last page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </footer>
    </section>
  );
}
