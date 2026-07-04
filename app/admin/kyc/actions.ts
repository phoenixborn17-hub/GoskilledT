// /admin/kyc server actions (GPS-M4 §2.2 — Tier A, PII). RBAC re-checked on every call. Reveal
// returns full PII (logged as KYC_VIEWED); decisions flip status + audit. Zod at the boundary.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import { revealKyc, reviewKyc, type RevealedKyc } from "../../../lib/admin/kyc";

export type RevealResult =
  | { ok: true; data: RevealedKyc }
  | { ok: false; error: string };

export async function revealKycAction(userId: string): Promise<RevealResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  if (!userId) return { ok: false, error: "Missing user" };
  try {
    const data = await revealKyc(admin, userId);
    return { ok: true, data };
  } catch {
    // Generic — never echo ciphertext or the underlying decrypt error.
    return { ok: false, error: "Could not reveal details." };
  }
}

const decisionSchema = z.object({
  userId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(300).optional(),
});

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function reviewKycAction(
  input: z.input<typeof decisionSchema>,
): Promise<ReviewResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const res = await reviewKyc(
    admin,
    parsed.data.userId,
    parsed.data.decision,
    parsed.data.reason,
  );
  if (!res.ok) return res;
  revalidatePath("/admin/kyc");
  revalidatePath(`/admin/kyc/${parsed.data.userId}`);
  revalidatePath("/admin");
  return { ok: true };
}
