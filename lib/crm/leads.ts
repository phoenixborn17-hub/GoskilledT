// Lead persistence (Ticket 6). Public upsert (dedup on [phone, source], first-touch attribution
// preserved) + the admin stage mutation (audited). Shaping lives in modules/crm/lead.ts.
import { prisma } from "../prisma";
import type { LeadData, LeadStage } from "../../modules/crm/lead";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "../admin/audit";

/** Public write. Re-registration refreshes name/stage but PRESERVES first-touch UTM/interest. */
export async function upsertLead(data: LeadData) {
  return prisma.lead.upsert({
    where: { phone_source: { phone: data.phone, source: data.source } },
    update: { name: data.name ?? undefined, stage: data.stage },
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
}

/** Admin mutation: update a lead's stage AND write the audit row atomically. */
export async function updateLeadStage(actor: AdminIdentity, leadId: string, stage: LeadStage) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.update({ where: { id: leadId }, data: { stage } });
    await recordAdminAction(tx, { actor, action: "LEAD_STAGE_UPDATE", entity: "Lead", entityId: leadId, meta: { stage } });
    return lead;
  });
}
