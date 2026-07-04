// Lesson 0 — the hidden "Getting Started" system course (DR-030 §5). It is a REAL course in the
// REAL LMS (same player, same LessonProgress) but hidden from every learner-facing catalog/list by
// slug (see queries.ts + catalog/queries.ts). Its one lesson is a free preview, so playback and
// completion work for any authenticated user even before the auto-enroll upsert lands — no gate.
import { prisma } from "../prisma";

export const GETTING_STARTED_SLUG = "getting-started";

export interface Lesson0Status {
  /** The lesson id to play (first lesson of the system course), or null if unseeded. */
  lessonId: string | null;
  completed: boolean;
  courseSlug: string;
}

/** Auto-enroll at registration (DR-030 §5). Idempotent; a missing course row is a no-op (free-
 *  preview access still lets the learner play Lesson 0). Best-effort — never block the signup. */
export async function ensureGettingStartedEnrollment(
  userId: string,
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { slug: GETTING_STARTED_SLUG },
    select: { id: true },
  });
  if (!course) return;
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    update: {},
    create: { userId, courseId: course.id, source: "DIRECT" },
  });
}

/** Lesson 0 status for the Hub (continue card + checklist item 1). One query, no writes. */
export async function getLesson0Status(userId: string): Promise<Lesson0Status> {
  const course = await prisma.course.findUnique({
    where: { slug: GETTING_STARTED_SLUG },
    select: {
      modules: {
        orderBy: { order: "asc" },
        take: 1,
        select: {
          lessons: { orderBy: { order: "asc" }, take: 1, select: { id: true } },
        },
      },
    },
  });
  const lessonId = course?.modules[0]?.lessons[0]?.id ?? null;
  if (!lessonId) {
    return {
      lessonId: null,
      completed: false,
      courseSlug: GETTING_STARTED_SLUG,
    };
  }
  const done = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { id: true },
  });
  return {
    lessonId,
    completed: !!done,
    courseSlug: GETTING_STARTED_SLUG,
  };
}
