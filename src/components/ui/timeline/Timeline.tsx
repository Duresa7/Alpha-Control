import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import './timeline.css';

import { TimelineEntry } from './TimelineEntry';

export interface TimelineItem {
  id?: string;
  date: string;
  title: string;
  description?: string;
  content?: ReactNode;
  href?: string;
  icon?: ReactNode;
  type?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  initialCount?: number;
  dateFormat?: Intl.DateTimeFormatOptions;
  className?: string;
  showMoreText?: string;
  showLessText?: string;
  animationDuration?: number;
  animationDelay?: number;
  showAnimation?: boolean;
}

export function Timeline({
  items,
  initialCount = 5,
  dateFormat,
  className,
  showMoreText = 'Show More',
  showLessText = 'Show Less',
  animationDuration = 0.3,
  animationDelay = 0.08,
  showAnimation = true,
}: TimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [items],
  );

  const initialItems = sortedItems.slice(0, initialCount);
  const remainingItems = sortedItems.slice(initialCount);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const renderItem = (item: TimelineItem, index: number) => {
    const key = item.id ?? `${item.title}-${item.date}-${index}`;
    const expanded = Boolean(expandedIds[key]);

    return (
      <motion.li
        key={key}
        initial={showAnimation ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
          duration: animationDuration,
          delay: index * animationDelay,
        }}
        className="timeline-shell__item"
      >
        <TimelineEntry
          item={item}
          expanded={expanded}
          onToggle={() => toggleExpanded(key)}
          dateFormat={dateFormat}
          animationDuration={animationDuration}
        />
      </motion.li>
    );
  };

  return (
    <div className={cn('timeline-shell', className)}>
      <ul className="timeline-shell__list">
        {initialItems.map(renderItem)}
        <AnimatePresence initial={false}>
          {showAll
            ? remainingItems.map((item, index) => renderItem(item, index + initialItems.length))
            : null}
        </AnimatePresence>
      </ul>

      {remainingItems.length > 0 ? (
        <motion.div
          initial={showAnimation ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          className="timeline-shell__toggle-wrap"
        >
          <button
            type="button"
            className="timeline-shell__toggle"
            onClick={() => setShowAll((current) => !current)}
          >
            <span>{showAll ? showLessText : showMoreText}</span>
            <motion.span
              animate={{ rotate: showAll ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </button>
        </motion.div>
      ) : null}
    </div>
  );
}
