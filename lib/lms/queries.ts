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
import type { PlaybackSource, VideoProvider } from "../video/provider";

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
  courseId: string;
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
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      progress: courseProgress(ordered, done),
      resumeLessonId: resumeLessonId(ordered, done),
    };
  });
}

/** All of a user's issued certificates, keyed by courseId — for the Progress tab (one query). */
export async function getCertificatesByCourse(
  userId: string,
): Promise<Map<string, { serial: string; issuedAt: Date }>> {
  const rows = await prisma.certificate.findMany({
    where: { userId },
    select: { courseId: true, serial: true, issuedAt: true },
  });
  return new Map(
    rows.map((r) => [r.courseId, { serial: r.serial, issuedAt: r.issuedAt }]),
  );
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

/**
 * Resolve a lesson to a playback source ONLY if it is accessible — the single gate the player uses.
 * Extracted so the "locked lesson never returns a URL" invariant (GPS-M2 §1C) is unit-testable
 * rather than living only inside the page's JSX. A locked lesson (or one with no asset) → null.
 */
export function resolvePlayback(
  lesson: { locked: boolean; videoAssetId: string | null },
  provider: VideoProvider,
): PlaybackSource | null {
  if (lesson.locked || !lesson.videoAssetId) return null;
  return provider.getPlayback(lesson.videoAssetId);
}

// ── My courses (§2.2) — entitlement view incl. the honest CB "as released" roadmap ──
export interface RoadmapCourse {
  slug: string;
  title: string;
  summary: string | null;
}
export interface EnrollmentsWithRoadmap {
  enrolled: EnrolledCourseCard[];
  /** Career Booster only: coming-soon catalog courses the learner will get "as released" (DR-021). */
  hasCareerBooster: boolean;
  roadmap: RoadmapCourse[];
}

/** True if the user has a PAID order for a package that includes future courses (Career Booster). */
async function hasCareerBoosterEntitlement(userId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { userId, status: "PAID", package: { includesFutureCourses: true } },
    select: { id: true },
  });
  return !!order;
}

/** My-courses view: enrolled courses (+progress) and, for CB buyers, the honest coming-soon roadmap. */
export async function getEnrollmentsWithRoadmap(
  userId: string,
): Promise<EnrollmentsWithRoadmap> {
  const [enrolled, hasCareerBooster] = await Promise.all([
    getEnrolledCourses(userId),
    hasCareerBoosterEntitlement(userId),
  ]);

  let roadmap: RoadmapCourse[] = [];
  if (hasCareerBooster) {
    const enrolledSlugs = new Set(enrolled.map((c) => c.slug));
    const coming = await prisma.course.findMany({
      where: { status: "COMING_SOON" },
      orderBy: { order: "asc" },
      select: { slug: true, title: true, summary: true },
    });
    roadmap = coming.filter((c) => !enrolledSlugs.has(c.slug));
  }
  return { enrolled, hasCareerBooster, roadmap };
}

/** The user's certificate for a course, if issued (read-only — issuance lives in lib/lms/certificate). */
export async function getCertificateForCourse(
  userId: string,
  courseId: string,
): Promise<{ serial: string; issuedAt: Date } | null> {
  return prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { serial: true, issuedAt: true },
  });
}
