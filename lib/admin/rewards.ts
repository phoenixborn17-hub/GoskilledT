// Admin reward-definition management (Phase D · DR-035). Admin-configurable reward targets. Every
// mutation is audited (recordAdminAction). No money, no PII. Validation is server-side.
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";

export interface RewardInput {
  title: string;
  description?: string | null;
  target: number;
  metric?: string;
  lastDate?: Date | null;
}

export type RewardResult =
  { ok: true; id: string } | { ok: false; error: string };

export async function listRewardDefinitions() {
  return prisma.rewardDefinition.findMany({ orderBy: { createdAt: "desc" } });
}

function validate(input: RewardInput): string | null {
  if (!input.title?.trim()) return "Title is required.";
  if (!Number.isInteger(input.target) || input.target <= 0)
    return "Target must be a positive whole number.";
  return null;
}

export async function createReward(
  actor: AdminIdentity,
  input: RewardInput,
): Promise<RewardResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const id = await prisma.$transaction(async (tx) => {
      const r = await tx.rewardDefinition.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          target: input.target,
          metric: input.metric?.trim() || "completed_referrals",
          lastDate: input.lastDate ?? null,
        },
        select: { id: true },
      });
      await recordAdminAction(tx, {
        actor,
        action: "REWARD_CREATED",
        entity: "RewardDefinition",
        entityId: r.id,
        meta: {
          target: input.target,
          metric: input.metric ?? "completed_referrals",
        },
      });
      return r.id;
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not create reward." };
  }
}

export async function setRewardActive(
  actor: AdminIdentity,
  id: string,
  isActive: boolean,
): Promise<RewardResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.rewardDefinition.update({ where: { id }, data: { isActive } });
      await recordAdminAction(tx, {
        actor,
        action: "REWARD_UPDATED",
        entity: "RewardDefinition",
        entityId: id,
        meta: { isActive },
      });
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not update reward." };
  }
}
