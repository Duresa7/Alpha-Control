import { supabase, supabaseConfigured } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { NotificationItem } from '@/types';

interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string;
  created_at: string;
}

function dbToNotification(row: DbNotification, isRead: boolean): NotificationItem {
  return {
    id: row.id,
    type: row.type as NotificationItem['type'],
    title: row.title,
    message: row.message,
    href: row.href,
    createdAt: row.created_at,
    read: isRead,
  };
}

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  if (!supabaseConfigured) return [];

  const { data: notifs, error: notifErr } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifErr) {
    logger.error('[notificationStorage] fetchNotifications failed:', notifErr.message);
    return [];
  }

  if (!notifs || notifs.length === 0) return [];

  const notifIds = notifs.map((n) => n.id);
  const { data: reads } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', userId)
    .in('notification_id', notifIds);

  const readSet = new Set((reads ?? []).map((r) => r.notification_id as string));

  return notifs.map((n) => dbToNotification(n, readSet.has(n.id)));
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  if (!supabaseConfigured) return 0;

  const { data: notifs, error: notifErr } = await supabase
    .from('notifications')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifErr) {
    logger.error('[notificationStorage] fetchUnreadCount failed:', notifErr.message);
    return 0;
  }

  if (!notifs || notifs.length === 0) return 0;

  const notifIds = notifs.map((n) => n.id);
  const { count, error: readErr } = await supabase
    .from('notification_reads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('notification_id', notifIds);

  if (readErr) {
    logger.error('[notificationStorage] fetchUnreadCount reads failed:', readErr.message);
    return notifs.length;
  }

  return notifs.length - (count ?? 0);
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (!supabaseConfigured) return;

  const { error } = await supabase
    .from('notification_reads')
    .upsert(
      { user_id: userId, notification_id: notificationId },
      { onConflict: 'user_id,notification_id' },
    );

  if (error) {
    logger.error('[notificationStorage] markNotificationRead failed:', error.message);
  }
}

export async function createNotification(
  type: 'article' | 'update',
  title: string,
  href: string,
  message?: string,
): Promise<boolean> {
  if (!supabaseConfigured) return false;

  const { error } = await supabase
    .from('notifications')
    .insert({ type, title, message: message ?? null, href });

  if (error) {
    logger.error('[notificationStorage] createNotification failed:', error.message);
    return false;
  }

  return true;
}
