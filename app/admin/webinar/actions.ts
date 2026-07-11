// /admin/webinar server actions (GPS-M4 §2.6 — Tier B). RBAC re-checked. Scheduling a session feeds
// the public /webinar page + Event JSON-LD (clears LC #27). Zod boundary.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import { scheduleWebinar, setWebinarActive } from "../../../lib/admin/webinar";

export type WebinarActionResult = { ok: true } | { ok: false; error: string };

const scheduleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  startsAt: z.string().min(1, "Date/time is required"),
  joinUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
});

export async function scheduleWebinarAction(
  input: z.input<typeof scheduleSchema>,
): Promise<WebinarActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime()))
    return { ok: false, error: "Enter a valid date/time." };

  const res = await scheduleWebinar(admin, {
    title: parsed.data.title,
    startsAt,
    joinUrl: parsed.data.joinUrl?.trim() || null,
  });
  if (res.ok) {
    revalidatePath("/admin/webinar");
    revalidatePath("/webinar");
  }
  return res;
}

const toggleSchema = z.object({
  webinarId: z.string().trim().min(1).max(64),
  isActive: z.boolean(),
}); // AD-12: validate the (id, boolean) pair at the boundary

export async function setWebinarActiveAction(
  webinarId: string,
  isActive: boolean,
): Promise<WebinarActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = toggleSchema.safeParse({ webinarId, isActive });
  if (!parsed.success) return { ok: false, error: "Missing session" };
  const res = await setWebinarActive(
    admin,
    parsed.data.webinarId,
    parsed.data.isActive,
  );
  if (res.ok) {
    revalidatePath("/admin/webinar");
    revalidatePath("/webinar");
  }
  return res;
}
