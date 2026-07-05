// GPS-M5 §2.0 — Course Knowledge Base loader. Reads transcript/notes/glossary rows for a course and
// turns them into retrieval chunks bound to their lesson (for exact "Lesson N" citations). Pure DB
// reads only (Guru itself may READ transcripts, never write them — §1C).
import { prisma } from "../prisma";
import { chunkText } from "../../modules/ai/guru/retrieval";
import type { KnowledgeChunk } from "../../modules/ai/guru/types";

export interface LessonContext {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number; // 1-based within the course
}

/** Resolve a lessonId to its course + the lesson's 1-based order within that course. */
export async function resolveLessonContext(
  lessonId: string,
): Promise<LessonContext | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, title: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return null;
  const courseId = lesson.module.courseId;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      slug: true,
      title: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          lessons: { orderBy: { order: "asc" }, select: { id: true } },
        },
      },
    },
  });
  if (!course) return null;

  const orderedIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const idx = orderedIds.indexOf(lessonId);
  return {
    courseId,
    courseSlug: course.slug,
    courseTitle: course.title,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    lessonOrder: idx >= 0 ? idx + 1 : 1,
  };
}

/**
 * Load the whole course's Knowledge Base as retrieval chunks. Guru answers a lesson-context doubt
 * from the ENTIRE enrolled course (so a concept taught two lessons earlier is still reachable), then
 * cites the specific lesson. Returns [] when the course has no knowledge yet (→ honest EMPTY state).
 */
export async function loadCourseKnowledge(
  courseId: string,
): Promise<KnowledgeChunk[]> {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          knowledge: { select: { kind: true, content: true } },
        },
      },
    },
  });

  const chunks: KnowledgeChunk[] = [];
  let order = 0;
  for (const m of modules) {
    for (const lesson of m.lessons) {
      order += 1; // 1-based lesson order across the course
      for (const k of lesson.knowledge) {
        chunks.push(
          ...chunkText(k.content, {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonOrder: order,
            kind: k.kind,
          }),
        );
      }
    }
  }
  return chunks;
}
