// /admin/withdrawals server actions (GPS-M4 §2.3 — Tier A, money). RBAC re-checked. Marking calls
// the domain PAYOUT path (idempotent, balance-rechecked); reject requires a reason. Zod boundary.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import {
  markWithdrawalPaid,
  rejectWithdrawal,
} from "../../../lib/admin/withdrawals";

export type MarkResult =
  { ok: true; idempotent: boolean } | { ok: false; error: string };

export async function markPaidAction(
  withdrawalId: string,
): Promise<MarkResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  if (!withdrawalId) return { ok: false, error: "Missing withdrawal" };
  const res = await markWithdrawalPaid(admin, withdrawalId);
  if (!res.ok) return res;
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  return { ok: true, idempotent: res.idempotent };
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
