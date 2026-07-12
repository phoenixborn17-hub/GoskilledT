// Daily learning-activity series — REAL lesson completions per IST day (D-29: an all-zero series
// is honest and the caller renders the unlock shell, never a fabricated curve). Shared by the Home
// command center momentum band (and available to any dashboard that needs the same series).
import { prisma } from "../prisma";

const istDay = (d: Date): string =>
  new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** Lessons completed per IST day for the last `days` days, oldest → newest. */
export async function getDailyLessonActivity(
  userId: string,
  days: number,
): Promise<number[]> {
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, completedAt: { gte: since } },
    select: { completedAt: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = istDay(r.completedAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const series: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    series.push(counts.get(istDay(new Date(Date.now() - i * 86_400_000))) ?? 0);
  }
  return series;
}
