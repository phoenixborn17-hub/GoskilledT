// Graph data adapters (Phase B / B2 · B4). Thin reads over CANON (ledger + referral graph +
// withdrawals) that return plain dated rows for the pure bucketing helpers in analytics.ts.
// No money math here (that lives in modules/ledger); no fabricated points (D-29 — empty in → empty out).
import { prisma } from "../prisma";
import type { DatedValue } from "./analytics";

type LiteEntry = { amountInPaise: number; createdAt: Date; type: string };

/** The user's USER_WALLET ledger entries (signed), oldest-first, with their transaction type. */
async function walletEntriesLite(userId: string): Promise<LiteEntry[]> {
  const account = await prisma.ledgerAccount.findUnique({
    where: { userId },
    select: {
      entries: {
        orderBy: { createdAt: "asc" },
        select: {
          amountInPaise: true,
          createdAt: true,
          transaction: { select: { type: true } },
        },
      },
    },
  });
  return (account?.entries ?? []).map((e) => ({
    amountInPaise: e.amountInPaise,
    createdAt: e.createdAt,
    type: e.transaction.type,
  }));
}

/** Earnings over time = positive COMMISSION credits (per-period sum via sumByBucket). */
export async function getEarningSeriesData(
  userId: string,
): Promise<DatedValue[]> {
  const entries = await walletEntriesLite(userId);
  return entries
    .filter((e) => e.type === "COMMISSION" && e.amountInPaise > 0)
    .map((e) => ({ date: e.createdAt, value: e.amountInPaise }));
}

/** Balance over time = every signed wallet leg (cumulativeByBucket → running balance). */
export async function getWalletBalanceData(
  userId: string,
): Promise<DatedValue[]> {
  const entries = await walletEntriesLite(userId);
  return entries.map((e) => ({ date: e.createdAt, value: e.amountInPaise }));
}

/** Payments received = withdrawals actually PAID out (paid date). Empty until D-01 — honest zero. */
export async function getPaymentsReceivedData(
  userId: string,
): Promise<DatedValue[]> {
  const paid = await prisma.withdrawal.findMany({
    where: { userId, status: "PAID" },
    select: { amountInPaise: true, paidAt: true, requestedAt: true },
  });
  return paid.map((w) => ({
    date: w.paidAt ?? w.requestedAt,
    value: w.amountInPaise,
  }));
}
