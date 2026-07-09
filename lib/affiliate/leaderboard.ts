// Leaderboard adapter (Phase D · DR-034/DR-035). Tally each affiliate's referred learners who have
// completed a course (a Certificate row), then rank by that count only (pure rankLeaderboard). No
// earnings, no team size. Privacy: only the affiliate's own FIRST NAME + their count are shown —
// never their downlines' identities. Honest empty state (D-29): no completions → empty board.
import { prisma } from "../prisma";
import {
  rankLeaderboard,
  type RankedEntry,
} from "../../modules/affiliate/leaderboard";

/** Tally completed-referrals per referrer across the whole graph (direct edges). */
async function completedReferralTally(): Promise<Map<string, number>> {
  const learners = await prisma.user.findMany({
    where: { referredById: { not: null }, certificates: { some: {} } },
    select: { referredById: true },
  });
  const tally = new Map<string, number>();
  for (const l of learners) {
    if (!l.referredById) continue;
    tally.set(l.referredById, (tally.get(l.referredById) ?? 0) + 1);
  }
  return tally;
}

/** Top affiliates ranked by completed-referrals (DR-034). Empty when nobody has completions yet. */
export async function getLeaderboard(limit = 20): Promise<RankedEntry[]> {
  const tally = await completedReferralTally();
  if (tally.size === 0) return [];
  const referrers = await prisma.user.findMany({
    where: { id: { in: [...tally.keys()] } },
    select: { id: true, name: true },
  });
  const entries = referrers.map((r) => ({
    userId: r.id,
    displayName: r.name?.trim().split(/\s+/)[0] || null,
    completedReferrals: tally.get(r.id) ?? 0,
  }));
  return rankLeaderboard(entries).slice(0, Math.max(0, limit));
}

/** The user's own standing in the full ranking, or null if they have no completed referrals. */
export async function getMyLeaderboardStanding(
  userId: string,
): Promise<RankedEntry | null> {
  const tally = await completedReferralTally();
  if (!tally.has(userId)) return null;
  const referrers = await prisma.user.findMany({
    where: { id: { in: [...tally.keys()] } },
    select: { id: true, name: true },
  });
  const ranked = rankLeaderboard(
    referrers.map((r) => ({
      userId: r.id,
      displayName: r.name?.trim().split(/\s+/)[0] || null,
      completedReferrals: tally.get(r.id) ?? 0,
    })),
  );
  return ranked.find((e) => e.userId === userId) ?? null;
}
