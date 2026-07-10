// /admin/leads mutation (Ticket 6, Task 3). The ONLY lead mutation this ticket allows.
// Writes an AdminAction audit row (actor = real admin) via updateLeadStage — no exceptions.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import { updateLeadStage } from "../../../lib/crm/leads";
import type { LeadStage } from "../../../modules/crm/lead";

// Zod at the boundary (Unit 3) — validate the id + the stage enum, never trust the client.
const stageSchema = z.object({
  leadId: z.string().trim().min(1).max(64),
  stage: z.enum([
    "NEW",
    "CONTACTED",
    "WEBINAR_REGISTERED",
    "CONVERTED",
    "LOST",
  ]),
});

export type StageResult = { ok: true } | { ok: false; error: string };

export async function updateLeadStageAction(
  leadId: string,
  stage: string,
): Promise<StageResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" }; // defence in depth (middleware also gates)
  const parsed = stageSchema.safeParse({ leadId, stage });
  if (!parsed.success) return { ok: false, error: "Invalid stage" };
  try {
    await updateLeadStage(
      admin,
      parsed.data.leadId,
      parsed.data.stage as LeadStage,
    );
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Update failed" };
  }
}
