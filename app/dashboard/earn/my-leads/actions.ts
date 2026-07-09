// My-Leads server actions (Phase D · D3). Owner-scoped: a lead is always created for the signed-in
// affiliate. PII is encrypted in the adapter; nothing here logs a phone/email.
"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../../../lib/auth/session";
import {
  createAffiliateLead,
  type LeadInput,
} from "../../../../lib/affiliate/leads";

export type LeadActionResult = { ok: true } | { ok: false; error: string };

export async function addAffiliateLead(
  input: LeadInput,
): Promise<LeadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const res = await createAffiliateLead(user.id, input);
  if (!res.ok) return res;
  revalidatePath("/dashboard/earn/my-leads");
  return { ok: true };
}
