// /admin/rewards server actions (Phase E/D). RBAC re-checked; every mutation audited in the adapter.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import { createReward, setRewardActive } from "../../../lib/admin/rewards";

export type RewardActionResult = { ok: true } | { ok: false; error: string };

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(300).optional(),
  target: z.coerce.number().int().positive("Target must be a positive number"),
  lastDate: z.string().trim().optional(),
});

export async function createRewardAction(
  input: z.input<typeof createSchema>,
): Promise<RewardActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  const lastDate = parsed.data.lastDate ? new Date(parsed.data.lastDate) : null;
  const res = await createReward(admin, {
    title: parsed.data.title,
    description: parsed.data.description,
    target: parsed.data.target,
    lastDate: lastDate && !isNaN(lastDate.getTime()) ? lastDate : null,
  });
  if (!res.ok) return res;
  revalidatePath("/admin/rewards");
  return { ok: true };
}

const toggleSchema = z.object({
  id: z.string().trim().min(1).max(64),
  isActive: z.boolean(),
}); // AD-12: validate the (id, boolean) pair at the boundary

export async function setRewardActiveAction(
  id: string,
  isActive: boolean,
): Promise<RewardActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = toggleSchema.safeParse({ id, isActive });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const res = await setRewardActive(
    admin,
    parsed.data.id,
    parsed.data.isActive,
  );
  if (!res.ok) return res;
  revalidatePath("/admin/rewards");
  return { ok: true };
}
