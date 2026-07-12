// Home momentum band — streamed below the first viewport (Command_Center_Spec §2.5). COMPOSITE
// reads only: learning activity from LessonProgress, the (eligible-only) earn trend from the SAME
// leak-tested ledger read the Earn graphs use. All-zero series stay all-zero — the panel renders
// the honest unlock shell, never a fabricated curve (D-29).
import { getDailyLessonActivity } from "../dashboard/activity";
import { isFeatureVisible } from "../feature-visibility/context";
import { isEligibleToEarn } from "../affiliate/eligibility";
import { getEarningSeriesData } from "../affiliate/graph-queries";

export interface HomeMomentum {
  /** Lessons per IST day, last 14 days (oldest → newest). */
  learning: number[];
  learningTotal: number;
  /** Recorded-commission paise per IST day, last 14 days — ONLY for eligible affiliates
   *  (DR-038/DR-040); null means the panel must not render at all (spec §2.5 recomposition). */
  earn: { series: number[]; totalInPaise: number } | null;
}

const istDay = (d: Date): string =>
  new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export async function getHomeMomentum(userId: string): Promise<HomeMomentum> {
  const [learning, affiliateVisible] = await Promise.all([
    getDailyLessonActivity(userId, 14),
    isFeatureVisible("earn"),
  ]);

  let earn: HomeMomentum["earn"] = null;
  if (affiliateVisible && (await isEligibleToEarn(userId))) {
    const rows = await getEarningSeriesData(userId); // signed COMMISSION credits, real ledger
    const since = new Date(Date.now() - 13 * 86_400_000);
    const perDay = new Map<string, number>();
    for (const r of rows) {
      if (r.date < since) continue;
      const k = istDay(r.date);
      perDay.set(k, (perDay.get(k) ?? 0) + r.value);
    }
    const series: number[] = [];
    for (let i = 13; i >= 0; i--) {
      series.push(
        perDay.get(istDay(new Date(Date.now() - i * 86_400_000))) ?? 0,
      );
    }
    earn = { series, totalInPaise: series.reduce((s, n) => s + n, 0) };
  }

  return {
    learning,
    learningTotal: learning.reduce((s, n) => s + n, 0),
    earn,
  };
}
