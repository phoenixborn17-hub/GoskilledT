// Ticket 4, Task 5 — scripted LMS flow against the live DB (skips without DATABASE_URL):
//   authenticated user → access control → enrollment → complete lesson → progress update.
// The Supabase OTP step needs live creds, so we enter at the post-login state (a created user).
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  assertLessonAccess, completeLesson, getCoursePlayerView, getEnrolledCourses, isEnrolled, LmsAccessError,
} from "@/lib/lms/queries";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = `lms${Date.now()}`;
const slug = `test-course-${runId}`;

describe.skipIf(!HAS_DB)("LMS flow (integration)", () => {
  let userId: string;
  let l1: string; // free preview
  let l2: string; // paid

  beforeAll(async () => {
    const course = await prisma.course.create({ data: { slug, title: "Test Course", status: "PUBLISHED" }, select: { id: true } });
    const mod = await prisma.module.create({ data: { courseId: course.id, title: "Module 1", order: 1 }, select: { id: true } });
    const a = await prisma.lesson.create({ data: { moduleId: mod.id, title: "L1 (preview)", order: 1, isFreePreview: true, videoAssetId: `${runId}-v1`, durationSec: 120 }, select: { id: true } });
    const b = await prisma.lesson.create({ data: { moduleId: mod.id, title: "L2", order: 2, isFreePreview: false, videoAssetId: `${runId}-v2`, durationSec: 150 }, select: { id: true } });
    l1 = a.id; l2 = b.id;
    const u = await prisma.user.create({ data: { phone: `+919${String(Date.now()).slice(-9)}`, referralCode: runId.toUpperCase() }, select: { id: true } });
    userId = u.id;
  });

  it("access control before enrollment: free preview allowed, paid lesson denied", async () => {
    expect(await isEnrolled(userId, (await prisma.course.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id)).toBe(false);
    await expect(assertLessonAccess(userId, l1)).resolves.toBeTruthy(); // free preview
    await expect(assertLessonAccess(userId, l2)).rejects.toBeInstanceOf(LmsAccessError); // paid, not enrolled
    await expect(completeLesson(userId, l2)).rejects.toBeInstanceOf(LmsAccessError); // cannot complete locked lesson
  });

  it("player view before enrollment: paid lessons locked, resume = first lesson", async () => {
    const view = await getCoursePlayerView(userId, slug);
    expect(view).not.toBeNull();
    const flat = view!.modules.flatMap((m) => m.lessons);
    expect(flat.find((l) => l.id === l1)!.locked).toBe(false);
    expect(flat.find((l) => l.id === l2)!.locked).toBe(true);
    expect(view!.resumeLessonId).toBe(l1);
    expect(view!.progress).toEqual({ completed: 0, total: 2, percent: 0 });
  });

  it("enroll → complete lessons → progress updates; resume advances", async () => {
    const course = await prisma.course.findUniqueOrThrow({ where: { slug }, select: { id: true } });
    await prisma.enrollment.create({ data: { userId, courseId: course.id } });

    const p1 = await completeLesson(userId, l1);
    expect(p1.progress).toEqual({ completed: 1, total: 2, percent: 50 });
    expect((await getCoursePlayerView(userId, slug))!.resumeLessonId).toBe(l2); // advanced

    const p2 = await completeLesson(userId, l2);
    expect(p2.progress).toEqual({ completed: 2, total: 2, percent: 100 });

    // Idempotent — completing again does not double-count.
    const again = await completeLesson(userId, l1);
    expect(again.progress.completed).toBe(2);

    const view = await getCoursePlayerView(userId, slug);
    expect(view!.resumeLessonId).toBeNull(); // course complete
  });

  it("dashboard shows the enrolled course with progress", async () => {
    const cards = await getEnrolledCourses(userId);
    const card = cards.find((c) => c.slug === slug);
    expect(card).toBeTruthy();
    expect(card!.progress).toEqual({ completed: 2, total: 2, percent: 100 });
  });
});
