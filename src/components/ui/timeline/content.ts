export interface TimelineContentSource {
  description?: string | null;
  expandedContent?: string | null;
}

export interface TimelineContent {
  description?: string;
  markdown?: string;
}

export function normalizeTimelineText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getTimelineContent(source: TimelineContentSource): TimelineContent {
  const description = normalizeTimelineText(source.description);
  const expandedContent = normalizeTimelineText(source.expandedContent);

  return {
    description,
    markdown: expandedContent && expandedContent !== description ? expandedContent : undefined,
  };
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getTimelinePreviewText(markdown?: string, maxLength = 160): string | undefined {
  if (!markdown) return undefined;

  const plainText = stripMarkdown(markdown);
  if (!plainText) return undefined;

  return plainText.length <= maxLength
    ? plainText
    : `${plainText.slice(0, maxLength).trimEnd()}...`;
}
