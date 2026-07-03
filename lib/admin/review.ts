// Review-queue mutation (Ticket 6). "Mark resolved" writes its own AdminAction audit row
// (no data mutation beyond the audit trail — the flag stays for history).
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";

export async function resolveReview(
  actor: AdminIdentity,
  orderId: string,
  note?: string,
) {
  return prisma.$transaction(async (tx) => {
    return recordAdminAction(tx, {
      actor,
      action: "REVIEW_RESOLVED",
      entity: "Order",
      entityId: orderId,
      meta: note ? { note } : undefined,
    });
  });
}
