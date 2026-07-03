// Clawback — DR-025 within-window refund reversal. Never mutates originals;
// emits compensating transactions. Post-window = manual ADJUSTMENT (not built here).
import { clawbackIdempotencyKey, type Level } from "./commission";
import { reversalLegs, type TxSpec } from "../ledger/ledger";

/** Reverse every commission txn of a refunded order. Input = the original TxSpecs (or their persisted equivalents). */
export function buildClawbackTxns(
  orderId: string,
  commissionTxns: TxSpec[],
): TxSpec[] {
  return commissionTxns.map((txn) => {
    const wallet = txn.legs.find((l) => l.account.kind === "USER_WALLET");
    if (!wallet || wallet.account.kind !== "USER_WALLET")
      throw new Error(`No wallet leg in ${txn.idempotencyKey}`);
    const level = Number(txn.idempotencyKey.split(":").pop()) as Level;
    return {
      type: "CLAWBACK" as const,
      idempotencyKey: clawbackIdempotencyKey(
        orderId,
        wallet.account.userId,
        level,
      ),
      refType: "Order",
      refId: orderId,
      legs: reversalLegs(txn.legs),
    };
  });
}
