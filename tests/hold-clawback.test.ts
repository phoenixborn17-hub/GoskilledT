// DR-025 — refund window, commission hold, clawback. Money in PAISE.
import { describe, it, expect } from "vitest";
import {
  REFUND_WINDOW_HOURS, commissionHoldUntil, isWithinRefundWindow,
  clawbackIdempotencyKey, commissionIdempotencyKey,
} from "../modules/affiliate/commission";
import {
  assertBalanced, availableBalanceOf, heldBalanceOf, balanceOf, reversalLegs, type LedgerLeg,
} from "../modules/ledger/ledger";

const paidAt = new Date("2026-07-03T10:00:00Z");
const inWindow = new Date("2026-07-04T10:00:00Z");
const afterWindow = new Date("2026-07-05T10:00:01Z");

describe("DR-025 refund window", () => {
  it("window is 48 hours", () => {
    expect(REFUND_WINDOW_HOURS).toBe(48);
    expect(commissionHoldUntil(paidAt).toISOString()).toBe("2026-07-05T10:00:00.000Z");
  });
  it("inside window ⇒ refundable; after ⇒ manual-only", () => {
    expect(isWithinRefundWindow(paidAt, inWindow)).toBe(true);
    expect(isWithinRefundWindow(paidAt, afterWindow)).toBe(false);
  });
});

describe("DR-025 held vs available", () => {
  const holdUntil = commissionHoldUntil(paidAt);
  const entries = [
    { amountInPaise: 90000, holdUntil },
    { amountInPaise: 15000, holdUntil },
    { amountInPaise: 40000, holdUntil: null },
  ];
  it("during hold: visible total ≠ withdrawable", () => {
    expect(balanceOf(entries)).toBe(145000);
    expect(heldBalanceOf(entries, inWindow)).toBe(105000);
    expect(availableBalanceOf(entries, inWindow)).toBe(40000);
  });
  it("after window: held → available automatically", () => {
    expect(heldBalanceOf(entries, afterWindow)).toBe(0);
    expect(availableBalanceOf(entries, afterWindow)).toBe(145000);
  });
});

describe("DR-025 clawback", () => {
  const credit: LedgerLeg[] = [
    { account: { kind: "COMMISSION_PAYABLE" }, amountInPaise: -90000 },
    { account: { kind: "USER_WALLET", userId: "u9" }, amountInPaise: 90000, holdUntil: commissionHoldUntil(paidAt) },
  ];
  it("reversal negates and stays balanced", () => {
    const reversal = reversalLegs(credit);
    expect(reversal[0].amountInPaise).toBe(90000);
    expect(reversal[1].amountInPaise).toBe(-90000);
    expect(() => assertBalanced(reversal)).not.toThrow();
  });
  it("credit + clawback nets wallet to zero — never available", () => {
    const reversal = reversalLegs(credit);
    expect(availableBalanceOf([credit[1], reversal[1]], afterWindow)).toBe(0);
  });
  it("R1: during the remaining window, clawback keeps available at 0 (never negative) and held at 0", () => {
    const reversal = reversalLegs(credit);
    const wallet = [credit[1], reversal[1]];
    expect(availableBalanceOf(wallet, inWindow)).toBe(0);
    expect(heldBalanceOf(wallet, inWindow)).toBe(0);
    // other, already-available money is untouched by a clawback
    const withOldMoney = [...wallet, { amountInPaise: 40000, holdUntil: null }];
    expect(availableBalanceOf(withOldMoney, inWindow)).toBe(40000);
  });
  it("idempotency keys stable", () => {
    expect(commissionIdempotencyKey("o1", "u9", 1)).toBe("commission:o1:u9:1");
    expect(clawbackIdempotencyKey("o1", "u9", 1)).toBe("clawback:o1:u9:1");
  });
});
