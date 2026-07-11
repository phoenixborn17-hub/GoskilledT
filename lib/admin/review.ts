// Review-queue mutation (Ticket 6). "Mark resolved" writes its own AdminAction audit row
// (no data mutation beyond the audit trail — the flag stays for history).
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";

export type ResolveReviewResult = { ok: true } | { ok: false; error: string };

export async function resolveReview(
  actor: AdminIdentity,
  orderId: string,
  note?: string,
): Promise<ResolveReviewResult> {
  // AD-11: only resolve a flag that actually exists, and only once (idempotency). Without this an
  // admin could resolve an arbitrary orderId, and repeated clicks would create duplicate audit rows.
  const [flag, already] = await Promise.all([
    prisma.adminAction.findFirst({
      where: { action: "FLAG_MANUAL_REVIEW", entityId: orderId },
      select: { id: true },
    }),
    prisma.adminAction.findFirst({
      where: { action: "REVIEW_RESOLVED", entityId: orderId },
      select: { id: true },
    }),
  ]);
  if (!flag)
    return { ok: false, error: "No pending review found for that order." };
  if (already) return { ok: true }; // idempotent — already resolved, no duplicate row

  await prisma.$transaction(async (tx) => {
    await recordAdminAction(tx, {
      actor,
      action: "REVIEW_RESOLVED",
      entity: "Order",
      entityId: orderId,
      meta: note ? { note } : undefined,
    });
  });
  return { ok: true };
}
