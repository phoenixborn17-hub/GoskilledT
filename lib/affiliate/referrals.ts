// Referral tree read (GPS-M3 §2.1). Privacy-masked 3-level view.
// NOTE ON SOURCE: the app's real referral attribution is `User.referredById` (M1 design; the
// webhook walks that chain to credit commissions). The `Referral` table named in the spec is not
// populated by the app, so reading it would report a FALSE "0 invites". D-29 ("truthful invite
// counts, real data only") wins: we derive the tree from the real graph. Documented in the M3
// close-out as a truthfulness-over-literal-source deviation.
import { prisma } from "../prisma";

export interface ReferralPerson {
  name: string | null; // L1 only (privacy: names not shown below L1)
  joinedAt: Date;
}

export interface ReferralTree {
  l1: ReferralPerson[]; // direct invites — names shown
  l1Count: number;
  l2Count: number; // aggregate only (privacy)
  l3Count: number; // aggregate only (privacy)
  totalInvites: number;
}

/** Walk `User.referredById` down 3 levels. L1 keeps names; L2/L3 are counts only. */
export async function getReferralTree(userId: string): Promise<ReferralTree> {
  const l1 = await prisma.user.findMany({
    where: { referredById: userId },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const l1Ids = l1.map((u) => u.id);

  const l2Ids = l1Ids.length
    ? (
        await prisma.user.findMany({
          where: { referredById: { in: l1Ids } },
          select: { id: true },
        })
      ).map((u) => u.id)
    : [];

  const l3Count = l2Ids.length
    ? await prisma.user.count({ where: { referredById: { in: l2Ids } } })
    : 0;

  return {
    l1: l1.map((u) => ({ name: u.name, joinedAt: u.createdAt })),
    l1Count: l1.length,
    l2Count: l2Ids.length,
    l3Count,
    totalInvites: l1.length + l2Ids.length + l3Count,
  };
}
