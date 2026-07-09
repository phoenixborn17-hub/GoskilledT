// Admin KPI aggregates (Phase E · E1). REAL aggregates from canon only (D-29 — empty in → empty
// series, never a fabricated bar). Time series are bucketed by the shared analytics helpers so the
// admin graphs reuse MiniChart. Read-only; no money moves.
import { prisma } from "../prisma";
import {
  sumByBucket,
  countByBucket,
  type SeriesPoint,
} from "../affiliate/analytics";
import { heldBalanceOf, availableBalanceOf } from "../../modules/ledger/ledger";

export interface AdminKpis {
  registrations: SeriesPoint[]; // new users by month
  purchases: SeriesPoint[]; // PAID orders by month
  commissionsCredited: SeriesPoint[]; // positive COMMISSION wallet legs, by month
  withdrawalsByStatus: SeriesPoint[]; // categorical counts
  kycPipeline: SeriesPoint[]; // categorical counts
  commissionsHeldInPaise: number; // snapshot across all affiliate wallets
  commissionsAvailableInPaise: number;
}

const CATEGORY_LABEL = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export async function getAdminKpis(): Promise<AdminKpis> {
  const [
    users,
    paidOrders,
    commissionLegs,
    withdrawalGroups,
    kycGroups,
    walletEntries,
  ] = await Promise.all([
    prisma.user.findMany({ select: { createdAt: true } }),
    prisma.order.findMany({
      where: { status: "PAID" },
      select: { paidAt: true, createdAt: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { amountInPaise: { gt: 0 }, transaction: { type: "COMMISSION" } },
      select: { amountInPaise: true, createdAt: true },
    }),
    prisma.withdrawal.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.kyc.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.ledgerEntry.findMany({
      where: { account: { type: "USER_WALLET" } },
      select: { amountInPaise: true, holdUntil: true },
    }),
  ]);

  return {
    registrations: countByBucket(
      users.map((u) => u.createdAt),
      "month",
    ),
    purchases: countByBucket(
      paidOrders.map((o) => o.paidAt ?? o.createdAt),
      "month",
    ),
    commissionsCredited: sumByBucket(
      commissionLegs.map((e) => ({
        date: e.createdAt,
        value: e.amountInPaise,
      })),
      "month",
    ),
    withdrawalsByStatus: withdrawalGroups
      .map((g) => ({
        key: g.status,
        label: CATEGORY_LABEL(g.status),
        value: g._count._all,
      }))
      .sort((a, b) => (a.key < b.key ? -1 : 1)),
    kycPipeline: kycGroups
      .map((g) => ({
        key: g.status,
        label: CATEGORY_LABEL(g.status),
        value: g._count._all,
      }))
      .sort((a, b) => (a.key < b.key ? -1 : 1)),
    commissionsHeldInPaise: heldBalanceOf(walletEntries),
    commissionsAvailableInPaise: availableBalanceOf(walletEntries),
  };
}
