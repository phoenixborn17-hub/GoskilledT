// /admin/withdrawals server actions (GPS-M4 §2.3 — Tier A, money). RBAC re-checked. Marking calls
// the domain PAYOUT path (idempotent, balance-rechecked); reject requires a reason. Zod boundary.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import {
  markWithdrawalPaid,
  markWithdrawalInProgress,
  rejectWithdrawal,
} from "../../../lib/admin/withdrawals";

// AD-12: validate the id at the boundary (not just presence) — consistent with the project's
// "Zod at every boundary" rule and the well-validated reject/review siblings.
const idSchema = z.string().trim().min(1).max(64);

export type MarkResult =
  { ok: true; idempotent: boolean } | { ok: false; error: string };

export async function markPaidAction(
  withdrawalId: string,
): Promise<MarkResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const id = idSchema.safeParse(withdrawalId);
  if (!id.success) return { ok: false, error: "Missing withdrawal" };
  const res = await markWithdrawalPaid(admin, id.data);
  if (!res.ok) return res;
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  return { ok: true, idempotent: res.idempotent };
}

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function markInProgressAction(
  withdrawalId: string,
): Promise<SimpleResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const id = idSchema.safeParse(withdrawalId);
  if (!id.success) return { ok: false, error: "Missing withdrawal" };
  const res = await markWithdrawalInProgress(admin, id.data);
  if (!res.ok) return res;
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  return { ok: true };
}

const rejectSchema = z.object({
  withdrawalId: z.string().min(1),
  reason: z.string().trim().min(1, "A reason is required").max(300),
});

export type RejectActionResult = { ok: true } | { ok: false; error: string };

export async function rejectWithdrawalAction(
  input: z.input<typeof rejectSchema>,
): Promise<RejectActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  const res = await rejectWithdrawal(
    admin,
    parsed.data.withdrawalId,
    parsed.data.reason,
  );
  if (!res.ok) return res;
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  return { ok: true };
}
