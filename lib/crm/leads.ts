// Lead persistence (Ticket 6). Public upsert (dedup on [phone, source], first-touch attribution
// preserved) + the admin stage mutation (audited). Shaping lives in modules/crm/lead.ts.
import { prisma } from "../prisma";
import {
  mergeStage,
  type LeadData,
  type LeadStage,
} from "../../modules/crm/lead";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "../admin/audit";

/**
 * Public write. Re-registration refreshes the name but PRESERVES first-touch UTM/interest and
 * NEVER downgrades the stage (mergeStage — CONVERTED is sticky, Ticket 8 Task 0). Read+merge in
 * ONE transaction so a concurrent re-register can't race the stage backward.
 */
export async function upsertLead(data: LeadData) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.lead.findUnique({
      where: { phone_source: { phone: data.phone, source: data.source } },
      select: { stage: true },
    });
    const stage = existing
      ? mergeStage(existing.stage as LeadStage, data.stage)
      : data.stage;
    return tx.lead.upsert({
      where: { phone_source: { phone: data.phone, source: data.source } },
      update: { name: data.name ?? undefined, stage },
      create: {
        phone: data.phone,
        source: data.source,
        name: data.name,
        stage: data.stage,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        packageInterest: data.packageInterest,
      },
    });
  });
}

/** Admin mutation: update a lead's stage AND write the audit row atomically. */
export async function updateLeadStage(
  actor: AdminIdentity,
  leadId: string,
  stage: LeadStage,
) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.update({
      where: { id: leadId },
      data: { stage },
    });
    await recordAdminAction(tx, {
      actor,
      action: "LEAD_STAGE_UPDATE",
      entity: "Lead",
      entityId: leadId,
      meta: { stage },
    });
    return lead;
  });
}
