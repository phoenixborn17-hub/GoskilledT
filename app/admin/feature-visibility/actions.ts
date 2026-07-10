// Feature Visibility admin actions (DR-040 · Tier A). Admin RBAC re-check → Zod at the boundary →
// delegate to the adapter (which writes + audits atomically). Discriminated result, never throws to
// the client. No money logic.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import {
  setFeatureOverride,
  clearFeatureOverride,
} from "../../../lib/admin/feature-visibility";

export type FlagActionResult = { ok: true } | { ok: false; error: string };

const setSchema = z.object({
  featureKey: z.string().trim().min(1).max(60),
  scope: z.enum(["GLOBAL", "ROLE", "USER"]),
  scopeValue: z.string().trim().max(200).default(""),
  visible: z.boolean(),
});

const clearSchema = z.object({
  featureKey: z.string().trim().min(1).max(60),
  scope: z.enum(["GLOBAL", "ROLE", "USER"]),
  scopeValue: z.string().trim().max(200).default(""),
});

export async function setFeatureVisibilityAction(
  input: z.input<typeof setSchema>,
): Promise<FlagActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = setSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const res = await setFeatureOverride(admin, parsed.data);
  if (!res.ok) return res;
  revalidatePath("/admin/feature-visibility");
  return { ok: true };
}

export async function clearFeatureVisibilityAction(
  input: z.input<typeof clearSchema>,
): Promise<FlagActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = clearSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const res = await clearFeatureOverride(admin, parsed.data);
  if (!res.ok) return res;
  revalidatePath("/admin/feature-visibility");
  return { ok: true };
}
