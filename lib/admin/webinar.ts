// Webinar admin adapter (GPS-M4 §2.6 — Tier B). Schedule the two-session model (Sun intro / Fri
// training) — this clears LC #27 mechanics. Scheduled sessions feed the public /webinar page +
// Event JSON-LD via getNextWebinar. Registrations come from CRM leads (WEBINAR_REGISTERED).
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";

export async function listWebinars() {
  return prisma.webinar.findMany({
    orderBy: { startsAt: "desc" },
    select: { id: true, title: true, startsAt: true, joinUrl: true, isActive: true },
  });
}

export async function listWebinarRegistrations(limit = 100) {
  return prisma.lead.findMany({
    where: { stage: "WEBINAR_REGISTERED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      phone: true,
      packageInterest: true,
      createdAt: true,
    },
  });
}

export type WebinarResult = { ok: true } | { ok: false; error: string };

export interface WebinarInput {
  title: string;
  startsAt: Date;
  joinUrl: string | null;
}

export async function scheduleWebinar(
  actor: AdminIdentity,
  input: WebinarInput,
): Promise<WebinarResult> {
  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  if (Number.isNaN(input.startsAt.getTime()))
    return { ok: false, error: "Enter a valid date/time." };
  try {
    await prisma.$transaction(async (tx) => {
      const w = await tx.webinar.create({
        data: {
          title: input.title.trim(),
          startsAt: input.startsAt,
          joinUrl: input.joinUrl?.trim() || null,
          isActive: true,
        },
        select: { id: true },
      });
      await recordAdminAction(tx, {
        actor,
        action: "WEBINAR_SCHEDULED",
        entity: "Webinar",
        entityId: w.id,
        meta: { title: input.title.trim(), startsAt: input.startsAt.toISOString() },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not schedule the session." };
  }
}

export async function setWebinarActive(
  actor: AdminIdentity,
  webinarId: string,
  isActive: boolean,
): Promise<WebinarResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.webinar.update({ where: { id: webinarId }, data: { isActive } });
      await recordAdminAction(tx, {
        actor,
        action: "WEBINAR_SCHEDULED",
        entity: "Webinar",
        entityId: webinarId,
        meta: { isActive },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the session." };
  }
}
