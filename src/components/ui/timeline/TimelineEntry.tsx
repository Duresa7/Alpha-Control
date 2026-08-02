import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import type { TimelineItem } from "./Timeline";

interface TimelineEntryProps {
  item: TimelineItem;
  expanded: boolean;
  onToggle: () => void;
  dateFormat?: Intl.DateTimeFormatOptions;
  animationDuration: number;
}

function formatTimelineDate(
  value: string,
  dateFormat?: Intl.DateTimeFormatOptions,
): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...dateFormat,
  });
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function renderTimelineContent(content: ReactNode) {
  if (typeof content === "string") {
    return (
      <div className="timeline-shell__markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            a: ({ node: _node, ...props }) => (
              <a {...props} target="_blank" rel="noreferrer" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return content;
}

export function TimelineEntry({
  item,
  expanded,
  onToggle,
  dateFormat,
  animationDuration,
}: TimelineEntryProps) {
  const displayDate = formatTimelineDate(item.date, dateFormat);
  const hasContent = Boolean(item.content);
  const hasHref = Boolean(item.href);
  const toneClass = item.type ? `timeline-tone--${item.type}` : "";
  const dotToneClass = item.type ? `timeline-shell__dot--${item.type}` : "";

  const typeBadge = item.type ? (
    <span className={cn("timeline-tone", toneClass)}>{item.type}</span>
  ) : null;

  const dateLabel = (
    <span className="timeline-shell__date-label">{displayDate}</span>
  );

  const card = (
    <div
      className="timeline-shell__card"
      data-open={hasContent ? expanded : undefined}
    >
      <div className="timeline-shell__mobile-meta">
        {dateLabel}
        {typeBadge}
      </div>

      <div className="timeline-shell__card-head">
        <div className="timeline-shell__card-copy">
          <div className="timeline-shell__desktop-meta">
            {typeBadge}
          </div>
          <h3 className="timeline-shell__title">{item.title}</h3>
          {item.description ? (
            <p className="timeline-shell__description">{item.description}</p>
          ) : null}
        </div>

        {hasContent ? (
          <span className="timeline-shell__entry-action" aria-hidden="true">
            <ChevronDown className={cn("h-4 w-4", expanded && "rotate-180")} />
          </span>
        ) : hasHref ? (
          <span className="timeline-shell__entry-action" aria-hidden="true">
            <ExternalLink className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {hasContent && expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: animationDuration }}
            className="overflow-hidden"
          >
            <div className="timeline-shell__content">
              {renderTimelineContent(item.content)}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const entryLayout = (
    <>
      <div className="timeline-shell__desktop-date">
        {dateLabel}
      </div>
      <div className="timeline-shell__rail">
        <div className="timeline-shell__line" />
        <div className={cn("timeline-shell__dot", dotToneClass)}>
          {item.icon ? (
            <span className="timeline-shell__dot-icon">{item.icon}</span>
          ) : null}
        </div>
      </div>
      <div className="timeline-shell__desktop-card">{card}</div>

      <div className="timeline-shell__mobile-entry">
        <div className="timeline-shell__mobile-rail">
          <div className="timeline-shell__line" />
          <div className={cn("timeline-shell__dot", dotToneClass)}>
            {item.icon ? (
              <span className="timeline-shell__dot-icon">{item.icon}</span>
            ) : null}
          </div>
        </div>
        <div className="timeline-shell__mobile-card">{card}</div>
      </div>
    </>
  );

  if (hasContent) {
    return (
      <button
        type="button"
        className="timeline-shell__entry-button"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {entryLayout}
      </button>
    );
  }

  if (hasHref && item.href) {
    const sharedClassName = "timeline-shell__entry-link";

    if (isExternalHref(item.href)) {
      return (
        <a
          href={item.href}
          className={sharedClassName}
          target="_blank"
          rel="noreferrer"
        >
          {entryLayout}
        </a>
      );
    }

    return (
      <Link to={item.href} className={sharedClassName}>
        {entryLayout}
      </Link>
    );
  }

  return <div className="timeline-shell__row">{entryLayout}</div>;
}
