// Pure LMS progress + access logic (Ticket 4). No DB, no framework — the single source of
// truth for progress %, resume, next-lesson, and lesson access. Adapters fetch rows and call
// these; UI never re-derives them. (New file — existing rule modules are untouched.)

export interface ProgressSummary {
  completed: number;
  total: number;
  percent: number; // 0–100, integer
}

/** completed / total across a course's lessons. */
export function courseProgress(
  allLessonIds: string[],
  completedLessonIds: Iterable<string>,
): ProgressSummary {
  const done = new Set(completedLessonIds);
  const total = allLessonIds.length;
  const completed = allLessonIds.reduce(
    (n, id) => (done.has(id) ? n + 1 : n),
    0,
  );
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

/**
 * Where to resume: the first lesson (in course order) not yet completed.
 * - no progress → first lesson ("Start Lesson 1")
 * - some progress → first incomplete ("Resume")
 * - all done → null (course complete)
 */
export function resumeLessonId(
  orderedLessonIds: string[],
  completedLessonIds: Iterable<string>,
): string | null {
  const done = new Set(completedLessonIds);
  return orderedLessonIds.find((id) => !done.has(id)) ?? null;
}

/** The lesson after `currentId` in course order, or null if it is the last (or unknown). */
export function nextLessonId(
  orderedLessonIds: string[],
  currentId: string,
): string | null {
  const i = orderedLessonIds.indexOf(currentId);
  if (i === -1 || i === orderedLessonIds.length - 1) return null;
  return orderedLessonIds[i + 1];
}

/**
 * Server-side access rule (never trust the client): an authenticated user may watch a lesson
 * iff they are enrolled OR the lesson is a free preview. Authentication is enforced upstream.
 */
export function canAccessLesson(
  lesson: { isFreePreview: boolean },
  ctx: { isEnrolled: boolean },
): boolean {
  return ctx.isEnrolled || lesson.isFreePreview;
}
