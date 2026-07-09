// Completed-referrals signal (Phase D · DR-034). The one canonical metric behind the leaderboard,
// tiers, and rewards: how many of a user's DIRECT referrals have completed a course. "Completed" =
// has a Certificate row (issued only on 100% + mandatory quizzes passed — see lib/lms/certificate).
// Derived from canon; never stored, never fabricated (D-29).
import { prisma } from "../prisma";

export async function completedReferralCount(userId: string): Promise<number> {
  return prisma.user.count({
    where: { referredById: userId, certificates: { some: {} } },
  });
}
