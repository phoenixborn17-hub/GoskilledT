// Learn workspace dashboard — composite loader (Redesign U4 · Dashboard §3). COMPOSITE: reads/
// composes EXISTING data only (no new business logic). Feeds the re-skinned Learn dashboard.
import { prisma } from "../prisma";
import { getEnrolledCourses } from "../lms/queries";
import { getGamification } from "../dashboard/gamification";
import { getNextWebinar } from "../crm/webinar";
import { listCatalogCourses } from "../catalog/queries";

export interface LearnCourseView {
  slug: string;
  courseId: string;
  title: string;
  percent: number;
  completed: number;
  total: number;
}

export interface LearnDashboard {
  name: string | null;
  goal: string | null;
  courses: LearnCourseView[];
  /** Continue-hero target: the active (in-progress) course, else the first, else null. */
  active: (LearnCourseView & { resumeHref: string }) | null;
  stats: {
    courses: number;
    overallPercent: number;
    certificates: number;
    streak: number;
  };
  /** Streak detail (Vibrant rollout Slice B) — same gamification source as `stats.streak`. */
  streakDetail: { current: number; atRisk: boolean; longest: number };
  /** Lessons per IST day, last 7 days (oldest → newest) — feeds the streak heat-strip. */
  last7: number[];
  weekLessons: number;
  /** Lessons completed per IST day for the last 14 days (real; all-zero → honest empty chart). */
  weeklyActivity: number[];
  activityTotal: number;
  webinar: { startsAt: Date; title: string } | null;
  recommendations: { slug: string; title: string; summary: string | null }[];
  lifecycleNew: boolean;
}

const istDay = (d: Date): string =>
  new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export async function getLearnDashboard(
  userId: string,
): Promise<LearnDashboard> {
  const since = new Date(Date.now() - 13 * 86_400_000);
  const [record, enrolled, game, certificates, catalog, webinar, activity] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, goal: true },
      }),
      getEnrolledCourses(userId),
      getGamification(userId),
      prisma.certificate.count({ where: { userId } }),
      listCatalogCourses(),
      getNextWebinar(),
      prisma.lessonProgress.findMany({
        where: { userId, completedAt: { gte: since } },
        select: { completedAt: true },
      }),
    ]);

  const courses: LearnCourseView[] = enrolled.map((c) => ({
    slug: c.slug,
    courseId: c.courseId,
    title: c.title,
    percent: c.progress.percent,
    completed: c.progress.completed,
    total: c.progress.total,
  }));

  const activeSrc =
    enrolled.find((c) => c.progress.percent < 100) ?? enrolled[0] ?? null;
  const active = activeSrc
    ? {
        slug: activeSrc.slug,
        courseId: activeSrc.courseId,
        title: activeSrc.title,
        percent: activeSrc.progress.percent,
        completed: activeSrc.progress.completed,
        total: activeSrc.progress.total,
        resumeHref: `/dashboard/learn/${activeSrc.slug}`,
      }
    : null;

  const overallPercent = courses.length
    ? Math.round(courses.reduce((s, c) => s + c.percent, 0) / courses.length)
    : 0;

  // Weekly activity (last 14 IST days, oldest → newest).
  const counts = new Map<string, number>();
  for (const p of activity) {
    const k = istDay(p.completedAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const weeklyActivity: number[] = [];
  for (let i = 13; i >= 0; i--) {
    weeklyActivity.push(
      counts.get(istDay(new Date(Date.now() - i * 86_400_000))) ?? 0,
    );
  }
  const activityTotal = weeklyActivity.reduce((s, n) => s + n, 0);
  const last7 = weeklyActivity.slice(7);
  const weekLessons = last7.reduce((s, n) => s + n, 0);
  const atRisk = game.streak.current > 0 && game.streak.state === "resting";

  const enrolledSlugs = new Set(courses.map((c) => c.slug));
  const recommendations = catalog
    .filter((c) => c.status === "PUBLISHED" && !enrolledSlugs.has(c.slug))
    .slice(0, 3)
    .map((c) => ({ slug: c.slug, title: c.title, summary: c.summary ?? null }));

  return {
    name: record?.name?.trim() || null,
    goal: record?.goal ?? null,
    courses,
    active,
    stats: {
      courses: courses.length,
      overallPercent,
      certificates,
      streak: game.streak.current,
    },
    streakDetail: {
      current: game.streak.current,
      atRisk,
      longest: game.streak.longest,
    },
    last7,
    weekLessons,
    weeklyActivity,
    activityTotal,
    webinar: webinar?.startsAt
      ? { startsAt: webinar.startsAt, title: webinar.title ?? "Live session" }
      : null,
    recommendations,
    lifecycleNew: !enrolled.some((c) => c.progress.completed > 0),
  };
}
