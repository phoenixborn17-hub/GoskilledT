"use client";
// Notification bell (Feature Batch v1.0 §1) — wires the previously-decorative bell
// (components/nav/app-shell.tsx) to a real panel. Money in any notification body is already
// static server-rendered text (DR-043 copy lives in lib/notifications/notify.ts) — this component
// never formats money itself, only displays what the server sent.
import * as React from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { IconButton } from "../ui/icon-button";
import { Popover } from "../ui/popover";
import {
  listNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type NotificationPanelData,
} from "../../app/dashboard/notification-actions";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationBell() {
  const [data, setData] = React.useState<NotificationPanelData>({
    notifications: [],
    unreadCount: 0,
  });
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(() => {
    listNotificationsAction().then(setData);
  }, []);

  React.useEffect(() => {
    listNotificationsAction()
      .then(setData)
      .finally(() => setLoaded(true));
  }, []);

  async function onRead(id: string) {
    setData((d) => ({
      unreadCount: Math.max(0, d.unreadCount - (isUnread(d, id) ? 1 : 0)),
      notifications: d.notifications.map((n) =>
        n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    }));
    await markNotificationReadAction(id);
  }

  async function onReadAll() {
    setData((d) => ({
      unreadCount: 0,
      notifications: d.notifications.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() },
      ),
    }));
    await markAllNotificationsReadAction();
  }

  return (
    <Popover
      align="end"
      trigger={
        <span className="relative inline-flex">
          <IconButton aria-label="Notifications" onClick={refresh}>
            <Bell className="h-5 w-5" aria-hidden />
          </IconButton>
          {data.unreadCount > 0 && (
            <span
              className="dc-enter absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white"
              aria-hidden
            >
              {data.unreadCount > 9 ? "9+" : data.unreadCount}
            </span>
          )}
        </span>
      }
    >
      <div className="w-80 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-small font-semibold text-ink">Notifications</p>
          {data.unreadCount > 0 && (
            <button
              type="button"
              onClick={onReadAll}
              className="inline-flex items-center gap-1 rounded text-caption font-semibold text-theme-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
            >
              <Check className="h-3 w-3" aria-hidden /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!loaded ? (
            <div className="space-y-1 p-2" aria-hidden>
              <div className="h-12 animate-pulse rounded-gs bg-charcoal/5" />
              <div className="h-12 animate-pulse rounded-gs bg-charcoal/5" />
            </div>
          ) : data.notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-small text-ink-muted">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul>
              {data.notifications.map((n) => (
                <li key={n.id}>
                  <NotificationRow notification={n} onRead={onRead} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Popover>
  );
}

function isUnread(
  d: NotificationPanelData,
  id: string,
): boolean {
  return d.notifications.some((n) => n.id === id && !n.readAt);
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: NotificationPanelData["notifications"][number];
  onRead: (id: string) => void;
}) {
  const unread = !n.readAt;
  const body = (
    <div
      className={
        "flex items-start gap-2 rounded-gs px-2 py-2 text-left transition-colors hover:bg-charcoal/5" +
        (unread ? " bg-theme/5" : "")
      }
    >
      {unread && (
        <span
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-theme"
          aria-hidden
        />
      )}
      <div className={unread ? "min-w-0 flex-1" : "min-w-0 flex-1 pl-3.5"}>
        <p className="text-small font-medium text-ink">{n.title}</p>
        <p className="text-caption text-ink-muted">{n.body}</p>
        <p className="mt-0.5 text-caption text-ink-muted">
          {timeAgo(n.createdAt)}
        </p>
      </div>
    </div>
  );

  if (n.linkUrl) {
    return (
      <Link href={n.linkUrl} onClick={() => unread && onRead(n.id)} className="block">
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => unread && onRead(n.id)}
      className="block w-full"
    >
      {body}
    </button>
  );
}
