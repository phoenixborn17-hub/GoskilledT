// Notification server actions (Feature Batch v1.0 §1). The bell panel is a client component that
// fetches/mutates through these — every action re-derives the current user server-side (the
// client is never trusted with a userId).
"use server";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/auth/session";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
  type NotificationView,
} from "../../lib/notifications/queries";

export interface NotificationPanelData {
  notifications: NotificationView[];
  unreadCount: number;
}

export async function listNotificationsAction(): Promise<NotificationPanelData> {
  const user = await getCurrentUser();
  if (!user) return { notifications: [], unreadCount: 0 };
  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(user.id),
    getUnreadNotificationCount(user.id),
  ]);
  return { notifications, unreadCount };
}

const idSchema = z.string().min(1);

/** Mark ONE notification read. Ownership-scoped — updateMany with userId so a foreign id is a no-op. */
export async function markNotificationReadAction(
  id: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false };
  await prisma.notification.updateMany({
    where: { id: parsed.data, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
