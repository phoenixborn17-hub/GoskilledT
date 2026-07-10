// DR-038 earning-eligibility adapter (DB-backed). Derives "has this user made their OWN confirmed
// purchase?" from real Orders — no new column, no fabricated state (D-29). Consumed by the
// commission engine's Phase-B gate (documented hook in lib/payments/webhook.ts CREDIT_COMMISSIONS)
// and directly by any surface that needs to show/act on affiliate earning-eligibility.
import { prisma } from "../prisma";
import type { Prisma, PrismaClient } from "../generated/prisma";
import { canEarnCommission } from "../../modules/affiliate/eligibility";

/** A Prisma client OR a transaction client — so callers inside a $transaction reuse this helper. */
type Db = PrismaClient | Prisma.TransactionClient;

/**
 * DR-038: true iff the user has ≥1 confirmed (PAID) order — i.e. their own purchase is complete.
 * "Confirmed" = Order.status "PAID" (the only state set by a Razorpay-verified webhook, Golden Rule 2).
 * REFUNDED orders do not count (status flips away from PAID on refund) — a refunded buyer is not eligible.
 *
 * `db` defaults to the shared client but accepts a transaction client, so the commission-credit path
 * (lib/payments/webhook.ts CREDIT_COMMISSIONS) can call THIS SAME helper inside its $transaction
 * instead of duplicating the query — removing the inline-query drift risk (Fable's Phase-B note).
 */
export async function hasConfirmedPurchase(
  userId: string,
  db: Db = prisma,
): Promise<boolean> {
  const paid = await db.order.count({ where: { userId, status: "PAID" } });
  return paid > 0;
}

/** DR-038 composed gate: may this affiliate earn commission on a downline's purchase? */
export async function isEligibleToEarn(userId: string): Promise<boolean> {
  return canEarnCommission({
    hasOwnConfirmedPurchase: await hasConfirmedPurchase(userId),
  });
}
