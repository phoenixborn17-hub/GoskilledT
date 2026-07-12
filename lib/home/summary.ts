// Home COMMAND CENTER — first-viewport summary payload (Command_Center_Dashboard_Spec §2 ·
// Amendments §F). COMPOSITE: reads EXISTING data only (no new money/business logic — eligibility
// via isEligibleToEarn (DR-038), visibility via isFeatureVisible (DR-040), wallet via the
// leak-tested ledger summary). Money is PAISE in, display-formatted at the edge via safeMoney.
// The earn metric is eligibility-forked THREE ways (spec §2.3): earn hidden → zero earn trace ·
// visible-not-eligible → people-not-money network card · eligible → DR-043 recorded earnings
// (recorded ≠ payable; payouts OFF pre-D-01 — copy says "open at launch", never "withdraw").
import { getCurrentUser } from "../auth/session";
import { prisma } from "../prisma";
import { siteUrl } from "../seo";
import { payoutsEnabled } from "../env";
import { getEnrolledCourses } from "../lms/queries";
import { getGamification } from "../dashboard/gamification";
import { getDailyLessonActivity } from "../dashboard/activity";
import { getNextWebinar } from "../crm/webinar";
import { getWalletSummaryFor } from "../wallet/queries";
import { isFeatureVisible } from "../feature-visibility/context";
import { isEligibleToEarn } from "../affiliate/eligibility";
import { getReferralTree } from "../affiliate/referrals";
import { formatINRFromPaise } from "../format";

/** Slot-4 of the key-metric row — the three-way eligibility fork (spec §2.3, HARD LOCK). */
export type EarnMetric =
  | { kind: "hidden" } // DR-040: the Affiliate layer is off — ZERO earn trace on Home.
  | { kind: "network"; l1Count: number } // visible but NOT eligible (DR-038) — people, never ₹.
  | {
      kind: "recorded"; // eligible — DR-043 recorded-earnings display.
      totalInPaise: number;
      heldInPaise: number;
      availableInPaise: number;
      payoutsOpen: boolean;
    };

export interface HomeMetrics {
  /** Average completion across enrolled courses (matches the Learn dashboard's Overall %). */
  overallPercent: number;
  coursesCount: number;
  certificates: number;
  streak: { current: number; atRisk: boolean; longest: number };
  /** Lessons per IST day, last 7 days (oldest → newest) — feeds the streak heat-strip. */
  last7: number[];
  /** Real lessons completed in the last 7 days (the progress delta line; 0 → line omitted). */
  weekLessons: number;
}

export interface HomeSummary {
  name: string | null;
  greetingTitle: string;
  /** The "today's spark" line — ONE honest lifecycle sentence (spec §2.2 priority rules). */
  sparkLine: string;
  lifecycleNew: boolean;
  streak: { current: number; atRisk: boolean };
  metrics: HomeMetrics;
  earn: EarnMetric;
  nextLesson: {
    title: string;
    subtitle: string;
    href: string;
    percent: number | null;
  } | null;
  webinarToday: { title: string; startsAt: Date } | null;
  /** Any upcoming webinar (slot-4 fallback when the Affiliate layer is hidden). */
  webinarNext: { title: string; startsAt: Date } | null;
  /** Next unearned milestone label (final slot-4 fallback — real gamification state). */
  nextMilestone: string | null;
  /** DR-040: resolved server-side; drives every affiliate/referral surface on Home. */
  affiliateVisible: boolean;
  /** Present ONLY when payouts are ON and a real balance exists (>0). Never faked. */
  walletAvailablePaise: number | null;
  referralCode: string;
  shareUrl: string;
}

function istHour(now: Date): number {
  return new Date(now.getTime() + 330 * 60_000).getUTCHours();
}
function istDay(d: Date): string {
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

export async function getHomeSummary(userId: string): Promise<HomeSummary> {
  const now = new Date();
  const [
    record,
    enrolled,
    game,
    webinar,
    certificates,
    last7,
    affiliateVisible,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, referralCode: true },
    }),
    getEnrolledCourses(userId),
    getGamification(userId),
    getNextWebinar(),
    prisma.certificate.count({ where: { userId } }),
    getDailyLessonActivity(userId, 7),
    isFeatureVisible("earn"),
  ]);

  const name = record?.name?.trim() || null;
  const referralCode = record?.referralCode ?? "";
  const shareUrl = `${siteUrl()}/register?ref=${referralCode}`;

  const started = enrolled.some((c) => c.progress.completed > 0);
  const lifecycleNew = !started;

  // Next lesson = an enrolled course still in progress (never invents a course).
  const active = enrolled.find((c) => c.progress.percent < 100);
  const nextLesson = active
    ? {
        title: active.title,
        subtitle: `${active.progress.completed} / ${active.progress.total} lessons`,
        href: `/dashboard/learn/${active.slug}`,
        percent: active.progress.percent,
      }
    : null;

  const atRisk = game.streak.current > 0 && game.streak.state === "resting";

  // Today's webinar only (IST) — otherwise it's the "next webinar" (slot-4 fallback).
  const webinarToday =
    webinar?.startsAt && istDay(webinar.startsAt) === istDay(now)
      ? { title: webinar.title ?? "Live session", startsAt: webinar.startsAt }
      : null;
  const webinarNext = webinar?.startsAt
    ? { title: webinar.title ?? "Live session", startsAt: webinar.startsAt }
    : null;

  // ── The earn slot — three-way eligibility fork (spec §2.3). Reuses the EXISTING predicates;
  //    no data is even fetched for a branch the viewer must not see. ──────────────────────────
  let earn: EarnMetric = { kind: "hidden" };
  if (affiliateVisible) {
    const eligible = await isEligibleToEarn(userId);
    if (eligible) {
      const w = await getWalletSummaryFor(userId);
      earn = {
        kind: "recorded",
        totalInPaise: w.totalInPaise,
        heldInPaise: w.heldInPaise,
        availableInPaise: w.availableInPaise,
        payoutsOpen: payoutsEnabled(),
      };
    } else {
      const tree = await getReferralTree(userId);
      earn = { kind: "network", l1Count: tree.l1Count };
    }
  }

  // Wallet-available (spark rule 3) — real ledger value, gated on the payout flag AND > 0.
  const walletAvailablePaise =
    earn.kind === "recorded" && earn.payoutsOpen && earn.availableInPaise > 0
      ? earn.availableInPaise
      : null;

  const overallPercent = enrolled.length
    ? Math.round(
        enrolled.reduce((s, c) => s + c.progress.percent, 0) / enrolled.length,
      )
    : 0;

  const metrics: HomeMetrics = {
    overallPercent,
    coursesCount: enrolled.length,
    certificates,
    streak: {
      current: game.streak.current,
      atRisk,
      longest: game.streak.longest,
    },
    last7,
    weekLessons: last7.reduce((s, n) => s + n, 0),
  };

  return {
    name,
    greetingTitle: `Namaste${name ? `, ${name}` : ""}`,
    sparkLine: sparkLine({
      lifecycleNew,
      streak: game.streak.current,
      atRisk,
      hour: istHour(now),
      activeCourse: active
        ? {
            title: active.title,
            remaining: Math.max(
              0,
              active.progress.total - active.progress.completed,
            ),
          }
        : null,
      walletAvailablePaise,
      webinarToday: webinarToday !== null,
    }),
    lifecycleNew,
    streak: { current: game.streak.current, atRisk },
    metrics,
    earn,
    nextLesson,
    webinarToday,
    webinarNext,
    nextMilestone: game.next?.label ?? null,
    affiliateVisible,
    walletAvailablePaise,
    referralCode,
    shareUrl,
  };
}

/**
 * The "today's spark" line (spec §2.2) — ONE honest sentence from real lifecycle state, priority
 * rules top-down, first match wins. States that don't exist are simply never mentioned (D-29).
 */
function sparkLine(s: {
  lifecycleNew: boolean;
  streak: number;
  atRisk: boolean;
  hour: number;
  activeCourse: { title: string; remaining: number } | null;
  walletAvailablePaise: number | null;
  webinarToday: boolean;
}): string {
  // 1 · streak at risk — supportive framing, not loss-anxiety.
  if (s.atRisk) {
    return `A 2-minute lesson today keeps your ${s.streak}-day streak alive.`;
  }
  // 2 · certificate within reach (1–3 lessons left on the active course).
  if (
    s.activeCourse &&
    s.activeCourse.remaining >= 1 &&
    s.activeCourse.remaining <= 3
  ) {
    const n = s.activeCourse.remaining;
    return `${n} ${n === 1 ? "lesson" : "lessons"} to your ${s.activeCourse.title} certificate.`;
  }
  // 3 · real money available (only ever set when payouts are ON and balance > 0).
  if (s.walletAvailablePaise != null) {
    return `${formatINRFromPaise(s.walletAvailablePaise)} is available in your wallet.`;
  }
  // 4 · live webinar today.
  if (s.webinarToday) {
    return "Live webinar today — your seat's saved.";
  }
  // 5 · active default (daypart-aware).
  if (!s.lifecycleNew) {
    if (s.streak >= 2) {
      return `Day ${s.streak} — you're building real momentum.`;
    }
    if (s.hour < 12) return "Good morning — ready to learn something today?";
    if (s.hour < 17) return "Good afternoon — pick up where you left off.";
    return "Good evening — a quick lesson before you wind down?";
  }
  // 6 · new-user default.
  return "Your first lesson is 2 minutes away.";
}

/** Convenience for the page: resolve the signed-in user + their summary. */
export async function getHomeSummaryForCurrentUser(): Promise<HomeSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getHomeSummary(user.id);
}
