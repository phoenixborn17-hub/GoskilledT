// Ticket 6, Task 4 — admin mutations write AdminAction audit rows with the REAL admin as actor
// (never "system"). Live DB (skips without DATABASE_URL).
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { updateLeadStage } from "@/lib/crm/leads";
import { resolveReview } from "@/lib/admin/review";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-9);
const actor = { supabaseId: `admin_${runId}`, email: "admin@example.com" };

describe.skipIf(!HAS_DB)("admin audit (integration)", () => {
  it("updateLeadStage changes stage AND writes an audited AdminAction", async () => {
    const lead = await prisma.lead.create({
      data: { phone: `+918${runId}`, source: `t6-${runId}`, stage: "NEW" },
      select: { id: true },
    });

    const updated = await updateLeadStage(actor, lead.id, "CONTACTED");
    expect(updated.stage).toBe("CONTACTED");

    const audit = await prisma.adminAction.findFirst({
      where: { action: "LEAD_STAGE_UPDATE", entity: "Lead", entityId: lead.id },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.actorSupabaseId).toBe(actor.supabaseId); // real admin, not "system"
    expect(audit!.actorEmail).toBe(actor.email);
    expect((audit!.meta as { stage?: string } | null)?.stage).toBe("CONTACTED");
  });

  it("resolveReview writes a REVIEW_RESOLVED audit row", async () => {
    const orderId = `order_${runId}`;
    // AD-11: resolveReview refuses to resolve an order that was never flagged. Seed the
    // FLAG_MANUAL_REVIEW the webhook would have written (actor "system"), matching real behaviour,
    // then resolve it.
    await prisma.adminAction.create({
      data: {
        actorSupabaseId: "system",
        action: "FLAG_MANUAL_REVIEW",
        entity: "Order",
        entityId: orderId,
        meta: { reason: "test flag" },
      },
    });

    const res = await resolveReview(actor, orderId);
    expect(res.ok).toBe(true);

    const audit = await prisma.adminAction.findFirst({
      where: { action: "REVIEW_RESOLVED", entityId: orderId },
    });
    expect(audit).not.toBeNull();
    expect(audit!.actorSupabaseId).toBe(actor.supabaseId);
  });

  it("resolveReview refuses to resolve an un-flagged order (AD-11)", async () => {
    const orderId = `order_noflag_${runId}`;
    const res = await resolveReview(actor, orderId);
    expect(res.ok).toBe(false);
    const audit = await prisma.adminAction.findFirst({
      where: { action: "REVIEW_RESOLVED", entityId: orderId },
    });
    expect(audit).toBeNull(); // nothing written for an order that was never flagged
  });
});
