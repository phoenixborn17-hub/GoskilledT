// Rewards progress (Phase D · DR-035). Consumer-side read: for each ACTIVE admin-defined reward,
// compute the affiliate's progress from canon (completed-referrals). No stored progress, no
// fabricated numbers (D-29). Learning-first framing — never earnings.
import { prisma } from "../prisma";
import { completedReferralCount } from "./completion";

export interface RewardProgress {
  id: string;
  title: string;
  description: string | null;
  metric: string;
  target: number;
  lastDate: Date | null;
  current: number;
  achieved: boolean;
  percent: number; // 0..100 (clamped)
}

export async function getRewardProgress(
  userId: string,
): Promise<RewardProgress[]> {
  const rewards = await prisma.rewardDefinition.findMany({
    where: { isActive: true },
    orderBy: { target: "asc" },
  });
  if (rewards.length === 0) return [];
  // Only "completed_referrals" is wired today; other metrics read 0 until implemented (honest).
  const completed = await completedReferralCount(userId);
  return rewards.map((r) => {
    const current = r.metric === "completed_referrals" ? completed : 0;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      metric: r.metric,
      target: r.target,
      lastDate: r.lastDate,
      current,
      achieved: current >= r.target,
      percent:
        r.target > 0
          ? Math.min(100, Math.round((current / r.target) * 100))
          : 0,
    };
  });
}
