// Wallet + commission ledger reads (GPS-M3 §2.2/§2.3). The UI NEVER computes money — every
// balance comes from the ledger domain (`walletSummary` over LedgerEntry.holdUntil). Adapters are
// thin: fetch rows, delegate math to modules/ledger + modules/wallet.
import { prisma } from "../prisma";
import {
  walletSummary,
  type WalletSummary,
} from "../../modules/wallet/summary";

export type CommissionState = "HELD" | "AVAILABLE" | "CANCELLED";

export interface CommissionLine {
  date: Date;
  level: number | null; // 1 | 2 | 3, parsed from the transaction idempotency key
  packageName: string | null;
  amountInPaise: number; // the user's signed wallet leg (negative for clawback)
  state: CommissionState;
  holdUntil: Date | null;
}

export interface WalletHistoryItem {
  date: Date;
  kind: "CREDIT" | "CLAWBACK" | "WITHDRAWAL";
  label: string;
  amountInPaise: number; // signed
}

type WalletEntry = {
  amountInPaise: number;
  holdUntil: Date | null;
  createdAt: Date;
  transaction: {
    type: string;
    refId: string | null;
    idempotencyKey: string;
    createdAt: Date;
  };
};

/** The user's USER_WALLET ledger entries (empty if no wallet account yet). */
async function userWalletEntries(userId: string): Promise<WalletEntry[]> {
  const account = await prisma.ledgerAccount.findUnique({
    where: { userId },
    select: {
      entries: {
        orderBy: { createdAt: "desc" },
        select: {
          amountInPaise: true,
          holdUntil: true,
          createdAt: true,
          transaction: {
            select: {
              type: true,
              refId: true,
              idempotencyKey: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
  return account?.entries ?? [];
}

/** Wallet summary (held/available/total/lifetime) DERIVED from the ledger — never a column. */
export async function getWalletSummaryFor(
  userId: string,
  now: Date = new Date(),
): Promise<WalletSummary> {
  const entries = await userWalletEntries(userId);
  return walletSummary(entries, now);
}

/** Held credits (still inside the refund window) with their "clears at" time — for the countdown UI. */
export async function getHeldCredits(
  userId: string,
  now: Date = new Date(),
): Promise<{ amountInPaise: number; holdUntil: Date }[]> {
  const entries = await userWalletEntries(userId);
  return entries
    .filter((e) => e.holdUntil && e.holdUntil > now && e.amountInPaise > 0)
    .map((e) => ({ amountInPaise: e.amountInPaise, holdUntil: e.holdUntil! }));
}

// idempotencyKey: "commission:{orderId}:{uplineId}:{level}" | "clawback:{orderId}:{uplineId}:{level}"
function parseLevel(idempotencyKey: string): number | null {
  if (!/^(commission|clawback):/.test(idempotencyKey)) return null;
  const level = Number(idempotencyKey.split(":").pop());
  return Number.isInteger(level) && level >= 1 && level <= 3 ? level : null;
}

/** Per-referral commission line items (§2.3). Sourced from the ledger; totals equal the wallet. */
export async function getCommissionLines(
  userId: string,
  now: Date = new Date(),
): Promise<CommissionLine[]> {
  const entries = (await userWalletEntries(userId)).filter((e) =>
    ["COMMISSION", "CLAWBACK", "ADJUSTMENT"].includes(e.transaction.type),
  );

  // Resolve package names from the referenced orders (one batched query).
  const orderIds = [
    ...new Set(
      entries.map((e) => e.transaction.refId).filter((x): x is string => !!x),
    ),
  ];
  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, package: { select: { name: true } } },
      })
    : [];
  const packageByOrder = new Map(orders.map((o) => [o.id, o.package.name]));

  return entries.map((e) => {
    const state: CommissionState =
      e.transaction.type === "CLAWBACK" || e.transaction.type === "ADJUSTMENT"
        ? "CANCELLED"
        : e.holdUntil && e.holdUntil > now
          ? "HELD"
          : "AVAILABLE";
    return {
      date: e.createdAt,
      level: parseLevel(e.transaction.idempotencyKey),
      packageName: e.transaction.refId
        ? (packageByOrder.get(e.transaction.refId) ?? null)
        : null,
      amountInPaise: e.amountInPaise,
      state,
      holdUntil: e.holdUntil,
    };
  });
}

/** Whether the user has an open (APPLIED / IN_PROGRESS) withdrawal — enforces single-pending. */
export async function hasPendingWithdrawal(userId: string): Promise<boolean> {
  const pending = await prisma.withdrawal.findFirst({
    where: { userId, status: { in: ["APPLIED", "IN_PROGRESS"] } },
    select: { id: true },
  });
  return !!pending;
}

/** Combined money history: commission credits, clawbacks, and withdrawals (newest first). */
export async function getWalletHistory(
  userId: string,
): Promise<WalletHistoryItem[]> {
  const [entries, withdrawals] = await Promise.all([
    userWalletEntries(userId),
    prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      select: { amountInPaise: true, status: true, requestedAt: true },
    }),
  ]);

  const ledgerItems: WalletHistoryItem[] = entries
    .filter((e) =>
      ["COMMISSION", "CLAWBACK", "ADJUSTMENT"].includes(e.transaction.type),
    )
    .map((e) => ({
      date: e.createdAt,
      kind: e.transaction.type === "COMMISSION" ? "CREDIT" : "CLAWBACK",
      label:
        e.transaction.type === "COMMISSION"
          ? "Commission credited"
          : "Refund reversal (clawback)",
      amountInPaise: e.amountInPaise,
    }));

  const withdrawalItems: WalletHistoryItem[] = withdrawals.map((w) => ({
    date: w.requestedAt,
    kind: "WITHDRAWAL",
    label: `Withdrawal ${w.status.toLowerCase()}`,
    amountInPaise: -w.amountInPaise,
  }));

  return [...ledgerItems, ...withdrawalItems].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}
