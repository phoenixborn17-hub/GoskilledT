// My-Leads server actions (Phase D · D3). Owner-scoped: a lead is always created for the signed-in
// affiliate. Zod-validated at the boundary (U3-E: never trust the client — bounds name/note/email,
// phone shape re-checked in the adapter). PII is encrypted in the adapter; nothing here logs it.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAffiliateLead } from "../../../../lib/affiliate/leads";

export type LeadActionResult = { ok: true } | { ok: false; error: string };

const leadSchema = z.object({
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().min(1, "Enter a mobile number").max(20),
  email: z.string().trim().max(120).optional(),
  note: z.string().trim().max(200).optional(),
});

export async function addAffiliateLead(
  input: z.input<typeof leadSchema>,
): Promise<LeadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  const res = await createAffiliateLead(user.id, parsed.data);
  if (!res.ok) return res;
  revalidatePath("/dashboard/earn/my-leads");
  return { ok: true };
}
