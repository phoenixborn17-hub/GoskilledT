// GPS-M5 §2.3 — gamification loader. DERIVED from real activity only (no new tables): learning days
// come from LessonProgress + passed quiz attempts; milestones from progress/certs. Nothing stored,
// nothing fabricated.
import { prisma } from "../prisma";
import { getEnrolledCourses } from "../lms/queries";
import {
  computeStreak,
  computeMilestones,
  nextMilestone,
  type StreakView,
  type Milestone,
} from "../../modules/lms/gamification";
import { notifyMilestoneIfNew } from "../notifications/notify";

/** Calendar day (Asia/Kolkata) for a timestamp — a "learning day" is one IST day with activity. */
function istDay(d: Date): string {
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

export interface GamificationView {
  streak: StreakView;
  milestones: Milestone[];
  next: Milestone | null;
  earnedCount: number;
}

export async function getGamification(
  userId: string,
): Promise<GamificationView> {
  const [progress, quizPasses, certificateCount, courses] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId },
      select: { completedAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { createdAt: true },
    }),
    prisma.certificate.count({ where: { userId } }),
    getEnrolledCourses(userId),
  ]);

  const activeDays = [
    ...new Set([
      ...progress.map((p) => istDay(p.completedAt)),
      ...quizPasses.map((q) => istDay(q.createdAt)),
    ]),
  ];
  const streak = computeStreak(activeDays, istDay(new Date()));
  const maxCoursePercent = courses.reduce(
    (m, c) => Math.max(m, c.progress.percent),
    0,
  );

  const milestones = computeMilestones({
    anyLessonDone: progress.length > 0,
    anyQuizPassed: quizPasses.length > 0,
    maxCoursePercent,
    certificateCount,
    longestStreak: streak.longest,
  });

  // MILESTONE notifications (Feature Batch v1.0 §1): milestones are DERIVED, never stored, so this
  // recomputation IS the source of truth — notifyMilestoneIfNew dedupes against the Notification
  // row itself (see lib/notifications/notify.ts) rather than a separate tracking table. Awaited
  // (not fire-and-forget): a detached promise isn't guaranteed to finish once a serverless request
  // handler returns. Cheap in practice — an already-notified milestone short-circuits on its dedup
  // lookup, and notify() itself never throws (fail-safe by contract).
  for (const m of milestones.filter((m) => m.achieved)) {
    await notifyMilestoneIfNew(userId, m.label);
  }

  return {
    streak,
    milestones,
    next: nextMilestone(milestones),
    earnedCount: milestones.filter((m) => m.achieved).length,
  };
}
