import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router';
import { Bell, FileText, Megaphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NewsThemeContext } from '@/components/news/theme/newsTheme';
import { formatRelativeTime } from '@/utils/format';
import type { NotificationItem } from '@/types';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from '@/data/notificationStorage';

const POLL_INTERVAL_MS = 60_000;

interface NotificationBellProps {
  variant?: 'landing' | 'news';
}

export function NotificationBell({ variant = 'landing' }: NotificationBellProps) {
  const { session } = useAuth();
  const newsThemeCtx = useContext(NewsThemeContext);
  const newsTheme = variant === 'news' ? (newsThemeCtx?.theme ?? 'light') : undefined;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const userId = session?.user?.id;

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;
    const count = await fetchUnreadCount(userId);
    setUnreadCount((prev) => (prev === count ? prev : count));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchUnreadCount(userId).then((count) => {
      if (!cancelled) setUnreadCount(count);
    });
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId, loadUnreadCount]);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open);

      if (open && userId) {
        const items = await fetchNotifications(userId);
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
      }
    },
    [userId],
  );

  const handleNotificationClick = useCallback(
    async (notifId: string) => {
      if (!userId) return;

      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setIsOpen(false);

      await markNotificationRead(userId, notifId);
    },
    [userId],
  );

  if (!session) return null;

  const isLanding = variant === 'landing';

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={isLanding ? 'portfolio-hero__notification-bell' : 'news-nav__icon-btn'}
          aria-label={unreadCount > 0 ? `${unreadCount} new notifications` : 'Notifications'}
          type="button"
        >
          <Bell size={isLanding ? 16 : 18} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="notification-popover p-0 border-0 bg-transparent rounded-xl"
        data-variant={variant}
        data-theme={newsTheme}
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="notification-popover__empty">No new notifications</div>
          ) : (
            <ul className="notification-popover__list">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={`notification-popover__item${item.read ? ' notification-popover__item--read' : ''}`}
                >
                  <span className="notification-popover__icon">
                    {item.type === 'article' ? <FileText size={20} /> : <Megaphone size={20} />}
                  </span>
                  <div className="notification-popover__content">
                    <Link
                      to={item.href}
                      className="notification-popover__link"
                      onClick={() => handleNotificationClick(item.id)}
                    >
                      {item.title}
                    </Link>
                    {item.message && (
                      <p className="notification-popover__message">{item.message}</p>
                    )}
                    <span className="notification-popover__time">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  {!item.read && <span className="notification-popover__unread-dot" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
