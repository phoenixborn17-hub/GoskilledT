// /admin/settings server actions (GPS-M4 §2.4 — Tier A, flag). RBAC re-checked. The payout-flag
// ceremony validates precondition (LC #1) + typed confirmation via the domain rule and records the
// audit row; it does NOT mutate env (activation = env change + redeploy). Zod boundary.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import { setPayoutsFlag } from "../../../lib/admin/settings";

const schema = z.object({
  direction: z.enum(["ENABLE", "DISABLE"]),
  typedConfirmation: z.string().max(64),
});

export type FlagActionResult =
  | { ok: true; note: string }
  | { ok: false; error: string };

export async function setPayoutsFlagAction(
  input: z.input<typeof schema>,
): Promise<FlagActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const res = await setPayoutsFlag(
    admin,
    parsed.data.direction,
    parsed.data.typedConfirmation,
  );
  if (!res.ok) return res;
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true, note: res.note };
}
