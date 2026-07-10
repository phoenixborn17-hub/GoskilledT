// Home hub — first-viewport summary payload (Redesign U3 · Frozen_Spec_Amendments §F).
// COMPOSITE: reads EXISTING data only (no new money/business logic). Deliberately lean so the first
// paint isn't blocked by the heavy below-fold slices (those stream separately). Money is READ from
// the ledger and gated on the payout flag — pre-D-01 it is simply absent (honest, no ₹ on Day-0).
import { getCurrentUser } from "../auth/session";
import { prisma } from "../prisma";
import { siteUrl } from "../seo";
import { payoutsEnabled } from "../env";
import { getEnrolledCourses } from "../lms/queries";
import { getGamification } from "../dashboard/gamification";
import { getNextWebinar } from "../crm/webinar";
import { getWalletSummaryFor } from "../wallet/queries";

export interface HomeSummary {
  name: string | null;
  greetingTitle: string;
  greetingMessage: string;
  lifecycleNew: boolean;
  streak: { current: number; atRisk: boolean };
  nextLesson: {
    title: string;
    subtitle: string;
    href: string;
    percent: number | null;
  } | null;
  webinarToday: { title: string; startsAt: Date } | null;
  /** Present ONLY when the payout flag is on AND a real balance exists (>0). Never faked. */
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
  const [record, enrolled, game, webinar] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, referralCode: true },
    }),
    getEnrolledCourses(userId),
    getGamification(userId),
    getNextWebinar(),
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

  // Today's webinar only (IST) — otherwise it's a "next webinar", surfaced elsewhere.
  const webinarToday =
    webinar?.startsAt && istDay(webinar.startsAt) === istDay(now)
      ? { title: webinar.title ?? "Live session", startsAt: webinar.startsAt }
      : null;

  // Wallet available — real ledger read, gated on the payout flag AND > 0 (Amendments §F).
  let walletAvailablePaise: number | null = null;
  if (payoutsEnabled()) {
    const w = await getWalletSummaryFor(userId);
    if (w.availableInPaise > 0) walletAvailablePaise = w.availableInPaise;
  }

  return {
    name,
    greetingTitle: `Namaste${name ? `, ${name}` : ""}`,
    greetingMessage: greetingMessage({
      lifecycleNew,
      streak: game.streak.current,
      atRisk,
      hour: istHour(now),
    }),
    lifecycleNew,
    streak: { current: game.streak.current, atRisk },
    nextLesson,
    webinarToday,
    walletAvailablePaise,
    referralCode,
    shareUrl,
  };
}

function greetingMessage(s: {
  lifecycleNew: boolean;
  streak: number;
  atRisk: boolean;
  hour: number;
}): string {
  if (s.atRisk) {
    return `Your ${s.streak}-day streak is waiting — a 2-minute lesson keeps it alive.`;
  }
  if (s.streak >= 2) {
    return `Day ${s.streak} streak — you're building real momentum.`;
  }
  if (s.lifecycleNew) {
    return "Let's start your first lesson — it takes just 2 minutes.";
  }
  if (s.hour < 12) return "Good morning — ready to learn something today?";
  if (s.hour < 17) return "Good afternoon — pick up where you left off.";
  return "Good evening — a quick lesson before you wind down?";
}

/** Convenience for the page: resolve the signed-in user + their summary. */
export async function getHomeSummaryForCurrentUser(): Promise<HomeSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getHomeSummary(user.id);
}
