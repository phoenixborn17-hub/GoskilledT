// /admin/review-queue mutation (Ticket 6, Task 3). "Mark resolved" writes its own AdminAction
// audit row (actor = real admin). This is where DR-025 post-window refunds & amount mismatches surface.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import { resolveReview } from "../../../lib/admin/review";

export type ResolveResult = { ok: true } | { ok: false; error: string };

const orderIdSchema = z.string().trim().min(1).max(64);

export async function resolveReviewAction(
  orderId: string,
): Promise<ResolveResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, error: "Missing order" };
  try {
    await resolveReview(admin, parsed.data);
    revalidatePath("/admin/review-queue");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to resolve" };
  }
}
