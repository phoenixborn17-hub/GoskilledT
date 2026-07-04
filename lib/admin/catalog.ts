// Catalog CRUD adapter (GPS-M4 §2.5 — Tier B). Real content enters the product here: edit courses,
// their modules, lessons and video asset ids; gate publish on real content. Guardrails:
//  - NO course creation (DR-011 7-course catalog — an 8th course needs a DR); only edits + publish.
//  - Slugs are immutable after publish. Entitlement/pricing are NEVER touched (packages stay
//    seed/DR-controlled) so this stays Tier B.
// Every write commits the domain change + its audit row in ONE $transaction.
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";
import { canPublishCourse } from "../../modules/admin/review";

export async function listAdminCatalog() {
  return prisma.course.findMany({
    orderBy: [{ status: "asc" }, { order: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      status: true,
      order: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              videoAssetId: true,
              durationSec: true,
              order: true,
              isFreePreview: true,
            },
          },
        },
      },
    },
  });
}

export async function getAdminCourse(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      status: true,
      order: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              videoAssetId: true,
              durationSec: true,
              order: true,
              isFreePreview: true,
            },
          },
        },
      },
    },
  });
}

export type CatalogResult = { ok: true } | { ok: false; error: string };

export interface CourseEdit {
  title: string;
  summary: string | null;
  category: string | null;
  order: number;
}

export async function updateCourse(
  actor: AdminIdentity,
  courseId: string,
  edit: CourseEdit,
): Promise<CatalogResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: courseId },
        data: {
          title: edit.title,
          summary: edit.summary,
          category: edit.category,
          order: edit.order,
        },
      });
      await recordAdminAction(tx, {
        actor,
        action: "COURSE_UPDATED",
        entity: "Course",
        entityId: courseId,
        meta: { title: edit.title, order: edit.order },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save the course." };
  }
}

/** Publish gate (§1B): requires ≥1 module + ≥1 lesson with a video asset id. */
export async function publishCourse(
  actor: AdminIdentity,
  courseId: string,
): Promise<CatalogResult> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      status: true,
      modules: { select: { lessons: { select: { videoAssetId: true } } } },
    },
  });
  if (!course) return { ok: false, error: "Course not found." };
  const gate = canPublishCourse(course.modules);
  if (!gate.ok) return { ok: false, error: gate.message };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: courseId },
        data: { status: "PUBLISHED" },
      });
      await recordAdminAction(tx, {
        actor,
        action: "COURSE_UPDATED",
        entity: "Course",
        entityId: courseId,
        meta: { published: true },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not publish the course." };
  }
}

export async function createModule(
  actor: AdminIdentity,
  courseId: string,
  title: string,
  order: number,
): Promise<CatalogResult> {
  if (!title.trim()) return { ok: false, error: "Module title is required." };
  try {
    await prisma.$transaction(async (tx) => {
      const m = await tx.module.create({
        data: { courseId, title: title.trim(), order },
        select: { id: true },
      });
      await recordAdminAction(tx, {
        actor,
        action: "COURSE_UPDATED",
        entity: "Module",
        entityId: m.id,
        meta: { courseId, title: title.trim(), created: true },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not add the module." };
  }
}

export interface LessonEdit {
  title: string;
  videoAssetId: string | null;
  durationSec: number;
  order: number;
  isFreePreview: boolean;
}

export async function upsertLesson(
  actor: AdminIdentity,
  moduleId: string,
  edit: LessonEdit,
  lessonId?: string,
): Promise<CatalogResult> {
  if (!edit.title.trim()) return { ok: false, error: "Lesson title is required." };
  const data = {
    title: edit.title.trim(),
    videoAssetId: edit.videoAssetId?.trim() || null,
    durationSec: Math.max(0, Math.trunc(edit.durationSec)),
    order: edit.order,
    isFreePreview: edit.isFreePreview,
  };
  try {
    await prisma.$transaction(async (tx) => {
      const lesson = lessonId
        ? await tx.lesson.update({
            where: { id: lessonId },
            data,
            select: { id: true },
          })
        : await tx.lesson.create({
            data: { ...data, moduleId },
            select: { id: true },
          });
      await recordAdminAction(tx, {
        actor,
        action: "LESSON_UPDATED",
        entity: "Lesson",
        entityId: lesson.id,
        meta: {
          moduleId,
          title: data.title,
          videoSet: !!data.videoAssetId,
          created: !lessonId,
        },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save the lesson." };
  }
}
