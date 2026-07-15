// Notification reads (Feature Batch v1.0 §1). Server-only — the bell panel fetches through the
// server actions in app/dashboard/notification-actions.ts, never a direct client query.
import { prisma } from "../prisma";

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null; // ISO — plain-serializable for a client component prop/action result
  createdAt: string;
}

function toView(n: {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationView {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    linkUrl: n.linkUrl,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

/** Most recent notifications, newest first. */
export async function getRecentNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationView[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toView);
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
