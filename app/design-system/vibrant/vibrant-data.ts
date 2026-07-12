// Vibrant v3 data composer (mockup-local, server-only). COMPOSITE READS ONLY over the product's
// existing loaders/tables — no new business logic, no money math, nothing fabricated (D-29).
// The EARN block exists in the payload ONLY when the Affiliate layer is visible (DR-040) AND the
// viewer is earning-eligible (DR-038) — a non-eligible payload cannot contain ₹ or network data.
import { prisma } from "../../../lib/prisma";
import { getHomeSummary, type HomeSummary } from "../../../lib/home/summary";
import { getHomeMomentum, type HomeMomentum } from "../../../lib/home/momentum";
import { getRecentActivity, type FeedEvent } from "../../../lib/home/feed";
import { getEnrolledCourses } from "../../../lib/lms/queries";
import {
  getEarnDashboard,
  type EarnDashboard,
} from "../../../lib/earn/dashboard";
import { getMyLeaderboardStanding } from "../../../lib/affiliate/leaderboard";
import {
  getRewardProgress,
  type RewardProgress,
} from "../../../lib/affiliate/rewards";
import { formatDuration } from "../../../lib/catalog/shape";

export interface LearningKpis {
  coursesEnrolled: number;
  coursesCompleted: number;
  overallPercent: number;
  /** Real watched-content proxy: total duration of COMPLETED lessons ("0 min" honest zero). */
  learningTimeLabel: string;
  certificates: number;
  /** Real per-course completion percents (first 6) — feeds the Courses mini-bars. */
  coursePercents: number[];
  /** Highest owned package name, or null (honest "No package yet"). */
  packageName: string | null;
  streak: { current: number; longest: number; atRisk: boolean };
}

export interface EarnBlock {
  dash: EarnDashboard;
  rank: { rank: number; completedReferrals: number } | null;
  rewards: RewardProgress[];
  latestWithdrawal: {
    status: string;
    amountInPaise: number;
    requestedAt: Date;
  } | null;
}

export interface VibrantData {
  summary: HomeSummary;
  momentum: HomeMomentum;
  activity: FeedEvent[];
  kpis: LearningKpis;
  /** null = viewer must not see earn data (hidden layer OR not eligible). */
  earn: EarnBlock | null;
}

export async function getVibrantData(userId: string): Promise<VibrantData> {
  const [summary, momentum, activity, enrolled, watched, paidOrders] =
    await Promise.all([
      getHomeSummary(userId),
      getHomeMomentum(userId),
      getRecentActivity(userId, 3),
      getEnrolledCourses(userId),
      prisma.lessonProgress.findMany({
        where: { userId },
        select: { lesson: { select: { durationSec: true } } },
      }),
      prisma.order.findMany({
        where: { userId, status: "PAID" },
        select: {
          package: { select: { name: true, includesFutureCourses: true } },
        },
      }),
    ]);

  const watchedSec = watched.reduce((s, r) => s + r.lesson.durationSec, 0);
  const pkg =
    paidOrders.find((o) => o.package.includesFutureCourses)?.package.name ??
    paidOrders[0]?.package.name ??
    null;

  const kpis: LearningKpis = {
    coursesEnrolled: enrolled.length,
    coursesCompleted: enrolled.filter((c) => c.progress.percent === 100).length,
    overallPercent: summary.metrics.overallPercent,
    learningTimeLabel: watchedSec > 0 ? formatDuration(watchedSec) : "0 min",
    certificates: summary.metrics.certificates,
    coursePercents: enrolled.slice(0, 6).map((c) => c.progress.percent),
    packageName: pkg,
    streak: {
      current: summary.metrics.streak.current,
      longest: summary.metrics.streak.longest,
      atRisk: summary.metrics.streak.atRisk,
    },
  };

  // EARN block — only fetched for an eligible affiliate (the summary fork already resolved both
  // predicates: kind==="recorded" ⇔ affiliateVisible && isEligibleToEarn).
  let earn: EarnBlock | null = null;
  if (summary.earn.kind === "recorded") {
    const record = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    const [dash, standing, rewards, latestWithdrawal] = await Promise.all([
      getEarnDashboard(userId, record?.referralCode ?? ""),
      getMyLeaderboardStanding(userId),
      getRewardProgress(userId),
      prisma.withdrawal.findFirst({
        where: { userId },
        orderBy: { requestedAt: "desc" },
        select: { status: true, amountInPaise: true, requestedAt: true },
      }),
    ]);
    earn = {
      dash,
      rank: standing
        ? {
            rank: standing.rank,
            completedReferrals: standing.completedReferrals,
          }
        : null,
      rewards,
      latestWithdrawal,
    };
  }

  return { summary, momentum, activity, kpis, earn };
}
