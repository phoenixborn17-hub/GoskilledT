// LMS server-side data access (Ticket 4). Fetches Prisma rows and delegates ALL logic to the
// pure module (modules/lms/progress.ts) — no rules re-implemented here. Access is enforced
// server-side; the client is never trusted.
import { prisma } from "../prisma";
import {
  courseProgress,
  resumeLessonId,
  canAccessLesson,
  type ProgressSummary,
} from "../../modules/lms/progress";

export class LmsAccessError extends Error {
  constructor(message = "You don't have access to this lesson") {
    super(message);
    this.name = "LmsAccessError";
  }
}

export interface CourseLessonView {
  id: string;
  title: string;
  durationSec: number;
  isFreePreview: boolean;
  videoAssetId: string | null;
  completed: boolean;
  locked: boolean; // not enrolled AND not a free preview
}
export interface CourseModuleView {
  id: string;
  title: string;
  lessons: CourseLessonView[];
}
export interface CoursePlayerView {
  course: { id: string; slug: string; title: string; summary: string | null };
  isEnrolled: boolean;
  modules: CourseModuleView[];
  orderedLessonIds: string[];
  progress: ProgressSummary;
  resumeLessonId: string | null;
}

export interface EnrolledCourseCard {
  slug: string;
  title: string;
  summary: string | null;
  progress: ProgressSummary;
  resumeLessonId: string | null;
}

const courseInclude = {
  modules: {
    orderBy: { order: "asc" as const },
    include: { lessons: { orderBy: { order: "asc" as const } } },
  },
};

export async function isEnrolled(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  return !!e;
}

/** Assemble the full player view for one course, with per-lesson completed/locked flags. */
export async function getCoursePlayerView(
  userId: string,
  courseSlug: string,
): Promise<CoursePlayerView | null> {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: courseInclude,
  });
  if (!course) return null;

  const enrolled = await isEnrolled(userId, course.id);
  const completed = new Set(await completedLessonIds(userId, course.id));

  const orderedLessonIds: string[] = [];
  const modules: CourseModuleView[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map((l) => {
      orderedLessonIds.push(l.id);
      return {
        id: l.id,
        title: l.title,
        durationSec: l.durationSec,
        isFreePreview: l.isFreePreview,
        videoAssetId: l.videoAssetId,
        completed: completed.has(l.id),
        locked: !canAccessLesson(l, { isEnrolled: enrolled }),
      };
    }),
  }));

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
    },
    isEnrolled: enrolled,
    modules,
    orderedLessonIds,
    progress: courseProgress(orderedLessonIds, completed),
    resumeLessonId: resumeLessonId(orderedLessonIds, completed),
  };
}

export async function completedLessonIds(
  userId: string,
  courseId: string,
): Promise<string[]> {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { module: { courseId } } },
    select: { lessonId: true },
  });
  return rows.map((r) => r.lessonId);
}

/** All enrolled courses with progress + resume — for the dashboard. One pass, no N+1. */
export async function getEnrolledCourses(
  userId: string,
): Promise<EnrolledCourseCard[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { course: { include: courseInclude } },
    orderBy: { enrolledAt: "asc" },
  });
  if (enrollments.length === 0) return [];

  const done = new Set(
    (
      await prisma.lessonProgress.findMany({
        where: { userId },
        select: { lessonId: true },
      })
    ).map((r) => r.lessonId),
  );

  return enrollments.map(({ course }) => {
    const ordered = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    return {
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      progress: courseProgress(ordered, done),
      resumeLessonId: resumeLessonId(ordered, done),
    };
  });
}

/** Throws LmsAccessError unless the user may watch this lesson (enrolled OR free preview). */
export async function assertLessonAccess(
  userId: string,
  lessonId: string,
): Promise<{ courseId: string }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { isFreePreview: true, module: { select: { courseId: true } } },
  });
  if (!lesson) throw new LmsAccessError("Lesson not found");
  const courseId = lesson.module.courseId;
  const enrolled = await isEnrolled(userId, courseId);
  if (!canAccessLesson(lesson, { isEnrolled: enrolled }))
    throw new LmsAccessError();
  return { courseId };
}

/** Mark a lesson complete (idempotent), after a server-side access check. Returns fresh progress. */
export async function completeLesson(
  userId: string,
  lessonId: string,
): Promise<{ courseId: string; progress: ProgressSummary }> {
  const { courseId } = await assertLessonAccess(userId, lessonId);
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  });
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: courseInclude,
  });
  const ordered = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completed = await completedLessonIds(userId, courseId);
  return { courseId, progress: courseProgress(ordered, completed) };
}
