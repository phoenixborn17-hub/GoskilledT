// /admin/leads mutation (Ticket 6, Task 3). The ONLY lead mutation this ticket allows.
// Writes an AdminAction audit row (actor = real admin) via updateLeadStage — no exceptions.
"use server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import { updateLeadStage } from "../../../lib/crm/leads";
import type { LeadStage } from "../../../modules/crm/lead";

const STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "WEBINAR_REGISTERED",
  "CONVERTED",
  "LOST",
];

export type StageResult = { ok: true } | { ok: false; error: string };

export async function updateLeadStageAction(
  leadId: string,
  stage: string,
): Promise<StageResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" }; // defence in depth (middleware also gates)
  if (!STAGES.includes(stage as LeadStage))
    return { ok: false, error: "Invalid stage" };
  try {
    await updateLeadStage(admin, leadId, stage as LeadStage);
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Update failed" };
  }
}
