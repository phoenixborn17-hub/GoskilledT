// /admin/catalog server actions (GPS-M4 §2.5 — Tier B). RBAC re-checked. Edits courses/modules/
// lessons + video asset ids; publish is gated on real content (domain rule). NO course creation
// (DR-011) and NO entitlement/pricing here (stays Tier B). Zod boundary.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import {
  updateCourse,
  publishCourse,
  createModule,
  upsertLesson,
} from "../../../lib/admin/catalog";

export type CatalogActionResult = { ok: true } | { ok: false; error: string };

async function admin() {
  return getAdminUser();
}

const courseSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(120),
  summary: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  order: z.coerce.number().int().min(0).max(999),
});

export async function updateCourseAction(
  input: z.input<typeof courseSchema>,
): Promise<CatalogActionResult> {
  const a = await admin();
  if (!a) return { ok: false, error: "Not authorized" };
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const res = await updateCourse(a, parsed.data.courseId, {
    title: parsed.data.title,
    summary: parsed.data.summary?.trim() || null,
    category: parsed.data.category?.trim() || null,
    order: parsed.data.order,
  });
  if (res.ok) revalidatePath(`/admin/catalog/${parsed.data.courseId}`);
  return res;
}

export async function publishCourseAction(
  courseId: string,
): Promise<CatalogActionResult> {
  const a = await admin();
  if (!a) return { ok: false, error: "Not authorized" };
  const res = await publishCourse(a, courseId);
  if (res.ok) {
    revalidatePath(`/admin/catalog/${courseId}`);
    revalidatePath("/admin/catalog");
  }
  return res;
}

const moduleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(1, "Module title is required").max(120),
  order: z.coerce.number().int().min(0).max(999),
});

export async function createModuleAction(
  input: z.input<typeof moduleSchema>,
): Promise<CatalogActionResult> {
  const a = await admin();
  if (!a) return { ok: false, error: "Not authorized" };
  const parsed = moduleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const res = await createModule(
    a,
    parsed.data.courseId,
    parsed.data.title,
    parsed.data.order,
  );
  if (res.ok) revalidatePath(`/admin/catalog/${parsed.data.courseId}`);
  return res;
}

const lessonSchema = z.object({
  courseId: z.string().min(1), // for revalidation
  moduleId: z.string().min(1),
  lessonId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "Lesson title is required").max(160),
  videoAssetId: z.string().trim().max(200).nullable().optional(),
  durationSec: z.coerce.number().int().min(0).max(100_000),
  order: z.coerce.number().int().min(0).max(999),
  isFreePreview: z.boolean(),
});

export async function upsertLessonAction(
  input: z.input<typeof lessonSchema>,
): Promise<CatalogActionResult> {
  const a = await admin();
  if (!a) return { ok: false, error: "Not authorized" };
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const res = await upsertLesson(
    a,
    parsed.data.moduleId,
    {
      title: parsed.data.title,
      videoAssetId: parsed.data.videoAssetId?.trim() || null,
      durationSec: parsed.data.durationSec,
      order: parsed.data.order,
      isFreePreview: parsed.data.isFreePreview,
    },
    parsed.data.lessonId,
  );
  if (res.ok) revalidatePath(`/admin/catalog/${parsed.data.courseId}`);
  return res;
}
