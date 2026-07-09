// Admin wallet-manage (Phase E · E2) — READ-ONLY. Lets an admin inspect affiliate wallet/ledger
// balances + history for support/audit. NO money movement here (payouts live only in
// lib/admin/withdrawals). Derived from the ledger; admin-authorized at the page/layer.
import { prisma } from "../prisma";
import {
  balanceOf,
  heldBalanceOf,
  availableBalanceOf,
} from "../../modules/ledger/ledger";
import {
  getWalletSummaryFor,
  getWalletHistory,
  type WalletHistoryItem,
} from "../wallet/queries";
import type { WalletSummary } from "../../modules/wallet/summary";

export interface AdminWalletRow {
  userId: string;
  name: string | null;
  phone: string | null;
  heldInPaise: number;
  availableInPaise: number;
  totalInPaise: number;
}

/** All affiliate wallets with a non-empty balance history, richest available-balance first. */
export async function listAffiliateWallets(): Promise<AdminWalletRow[]> {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { type: "USER_WALLET", userId: { not: null } },
    select: {
      userId: true,
      entries: { select: { amountInPaise: true, holdUntil: true } },
      user: { select: { name: true, phone: true } },
    },
  });
  return accounts
    .filter((a) => a.entries.length > 0)
    .map((a) => ({
      userId: a.userId!,
      name: a.user?.name ?? null,
      phone: a.user?.phone ?? null,
      heldInPaise: heldBalanceOf(a.entries),
      availableInPaise: availableBalanceOf(a.entries),
      totalInPaise: balanceOf(a.entries),
    }))
    .sort((x, y) => y.availableInPaise - x.availableInPaise);
}

export interface AdminWalletDetail {
  userId: string;
  name: string | null;
  phone: string | null;
  summary: WalletSummary;
  history: WalletHistoryItem[];
}

/** One affiliate's wallet detail (summary + full history). Read-only. Null if the user doesn't exist. */
export async function getAffiliateWalletDetail(
  userId: string,
): Promise<AdminWalletDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true },
  });
  if (!user) return null;
  const [summary, history] = await Promise.all([
    getWalletSummaryFor(userId),
    getWalletHistory(userId),
  ]);
  return { userId, name: user.name, phone: user.phone, summary, history };
}
