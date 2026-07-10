// Leaderboard ranking — PURE domain (Phase D · DR-034/DR-035). The ONLY ranking signal is
// "completed referrals" = referred learners who have completed a course. It is NEVER earnings and
// NEVER raw team/network size (DR-035 compliance-safe, learning-first). This module is framework/
// DB-free and unit-tested; the adapter (lib/affiliate/leaderboard.ts) supplies the counts from canon.

export interface LeaderboardEntry {
  userId: string;
  displayName: string | null; // first name only (privacy)
  completedReferrals: number; // referred learners who completed ≥1 course (DR-034)
}

export interface RankedEntry extends LeaderboardEntry {
  rank: number;
}

/**
 * Rank by completedReferrals DESC (DR-034). Equal counts share a rank (competition ranking: 1,2,2,4).
 * Ties are ordered deterministically by userId so the output is stable. NEVER sorts by earnings or
 * team size — those aren't even inputs here (DR-035).
 */
export function rankLeaderboard(entries: LeaderboardEntry[]): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) =>
      b.completedReferrals - a.completedReferrals ||
      (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
  );
  let rank = 0;
  let prevCount: number | null = null;
  return sorted.map((e, i) => {
    if (prevCount === null || e.completedReferrals !== prevCount) {
      rank = i + 1; // competition ranking — skip after ties
      prevCount = e.completedReferrals;
    }
    return { ...e, rank };
  });
}
