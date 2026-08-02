import { supabase, supabaseConfigured } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export type TimelineEntryType = 'update' | 'release' | 'incident' | 'maintenance';

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  type: TimelineEntryType;
  expandedContent: string;
  timestamp: string;
}

export interface TimelineInput {
  title: string;
  description?: string;
  type: TimelineEntryType;
  expandedContent?: string;
  timestamp?: string;
}

interface DbEntry {
  id: string;
  title: string;
  description: string;
  type: string;
  expanded_content: string;
  timestamp: string;
}

function dbToEntry(row: DbEntry): TimelineEntry {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as TimelineEntryType,
    expandedContent: row.expanded_content,
    timestamp: row.timestamp,
  };
}

export async function fetchTimelineEntries(): Promise<TimelineEntry[]> {
  if (!supabaseConfigured) return [];

  const { data, error } = await supabase
    .from('timeline_entries')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    logger.error('Failed to fetch timeline entries:', error);
    return [];
  }

  return (data as DbEntry[]).map(dbToEntry);
}

export async function createTimelineEntry(input: TimelineInput): Promise<TimelineEntry> {
  if (!supabaseConfigured) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('timeline_entries')
    .insert({
      title: input.title,
      description: input.description ?? '',
      type: input.type,
      expanded_content: input.expandedContent ?? '',
      timestamp: input.timestamp ?? new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to create timeline entry:', error);
    throw error;
  }

  return dbToEntry(data as DbEntry);
}

export async function updateTimelineEntry(
  id: string,
  input: Partial<TimelineInput>,
): Promise<void> {
  if (!supabaseConfigured) return;

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.type !== undefined) updates.type = input.type;
  if (input.expandedContent !== undefined) updates.expanded_content = input.expandedContent;
  if (input.timestamp !== undefined) updates.timestamp = input.timestamp;

  const { error } = await supabase.from('timeline_entries').update(updates).eq('id', id);
  if (error) {
    logger.error('Failed to update timeline entry:', error);
    throw error;
  }
}

export async function deleteTimelineEntry(id: string): Promise<void> {
  if (!supabaseConfigured) return;

  const { error } = await supabase.from('timeline_entries').delete().eq('id', id);
  if (error) {
    logger.error('Failed to delete timeline entry:', error);
    throw error;
  }
}
