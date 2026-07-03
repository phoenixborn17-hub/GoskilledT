// Commission crediting — builds ledger TxSpecs for a VERIFIED payment (Golden Rule 2).
// DR-007 amounts · DR-025 hold. One balanced transaction per upline level.
import { commissionForLevel, commissionIdempotencyKey, commissionHoldUntil, type PackageSlug } from "./commission";
import type { UplineHop } from "./upline";
import { assertBalanced, type TxSpec } from "../ledger/ledger";

export function buildCommissionTxns(input: {
  orderId: string;
  pkg: PackageSlug;
  paidAt: Date;
  uplines: UplineHop[];
}): TxSpec[] {
  const holdUntil = commissionHoldUntil(input.paidAt);
  return input.uplines.map(({ userId, level }) => {
    const amount = commissionForLevel(input.pkg, level);
    const legs = [
      { account: { kind: "COMMISSION_PAYABLE" as const }, amountInPaise: -amount },
      { account: { kind: "USER_WALLET" as const, userId }, amountInPaise: amount, holdUntil },
    ];
    assertBalanced(legs);
    return {
      type: "COMMISSION" as const,
      idempotencyKey: commissionIdempotencyKey(input.orderId, userId, level),
      refType: "Order",
      refId: input.orderId,
      legs,
    };
  });
}
