import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, ShieldAlert, Sparkles, Wrench } from 'lucide-react';

import { NewsShell } from '@/components/news/NewsShell';
import { Timeline, getTimelineContent, type TimelineItem } from '@/components/ui/timeline';
import { fetchLiveStatuses } from '@/data/liveStatuses';
import { fetchTimelineEntries } from '@/data/timelineStorage';
import type { ServiceStatus } from '@/data/liveStatuses';
import type { TimelineEntry, TimelineEntryType } from '@/data/timelineStorage';

function StatusCard({ status }: { status: ServiceStatus }) {
  return (
    <div className="status-card">
      <div className="status-card__header">
        <span className="status-card__name">{status.name}</span>
        <div className={`status-card__dot status-card__dot--${status.status}`} />
      </div>
      {status.metric ? (
        <>
          <p className="status-card__metric">{status.metric}</p>
          <p className="status-card__label">{status.metricLabel}</p>
        </>
      ) : (
        <>
          <p className={`status-card__status-text status-card__status-text--${status.status}`}>
            {status.status}
          </p>
          <p className="status-card__label">{status.description}</p>
        </>
      )}
    </div>
  );
}

const TIMELINE_ICONS: Record<TimelineEntryType, ReactNode> = {
  update: <Sparkles className="h-3.5 w-3.5" />,
  release: <ShieldAlert className="h-3.5 w-3.5" />,
  incident: <AlertTriangle className="h-3.5 w-3.5" />,
  maintenance: <Wrench className="h-3.5 w-3.5" />,
};

function toTimelineItems(entries: TimelineEntry[]): TimelineItem[] {
  return entries.map((entry) => {
    const { description, markdown } = getTimelineContent(entry);

    return {
      id: entry.id,
      date: entry.timestamp,
      title: entry.title,
      description,
      content: markdown,
      type: entry.type,
      icon: TIMELINE_ICONS[entry.type],
    };
  });
}

export function ServicesPage() {
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchLiveStatuses(), fetchTimelineEntries()]).then(([s, e]) => {
      if (!cancelled) {
        setStatuses(s);
        setEntries(e);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NewsShell>
      <div className="services-dash">
        <header className="services-dash__header">
          <h1 className="services-dash__title">AlphaSec Services</h1>
          <p className="services-dash__subtitle">
            Platform status, release history, and operational metrics.
          </p>
        </header>

        <div className="services-dash__grid">
          {statuses.map((status) => (
            <StatusCard key={status.id} status={status} />
          ))}
        </div>

        <section className="services-dash__timeline">
          <h2 className="services-dash__timeline-header">Latest Updates</h2>
          {entries.length === 0 && <p className="article-dash__empty">No updates yet.</p>}
          {entries.length > 0 && (
            <Timeline
              items={toTimelineItems(entries)}
              initialCount={3}
              showMoreText="Load More"
              showLessText="Show Less"
            />
          )}
        </section>
      </div>
    </NewsShell>
  );
}
