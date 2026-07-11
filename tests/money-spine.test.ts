// M1 Money Spine — end-to-end domain-logic suite. Every rupee path, no DB needed.
import { describe, it, expect } from "vitest";
import { gstFromInclusive } from "../modules/payments/gst";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../modules/payments/razorpay";
import {
  decideWebhookActions,
  type OrderState,
} from "../modules/payments/webhook-flow";
import { resolveUplines } from "../modules/affiliate/upline";
import { buildCommissionTxns } from "../modules/affiliate/credit";
import { buildClawbackTxns } from "../modules/affiliate/clawback";
import {
  coursesToEnroll,
  autoEnrollOnPublish,
} from "../modules/lms/entitlement";
import {
  validateWithdrawal,
  MIN_WITHDRAWAL_PAISE,
  MAX_WITHDRAWAL_PAISE,
} from "../modules/wallet/withdrawal";
import { walletSummary } from "../modules/wallet/summary";
import { commissionHoldUntil } from "../modules/affiliate/commission";
import { availableBalanceOf } from "../modules/ledger/ledger";
import { createHmac } from "node:crypto";

const paidAt = new Date("2026-07-03T10:00:00Z");
const inWin = new Date("2026-07-04T10:00:00Z");
const afterWin = new Date("2026-07-06T10:00:00Z");

describe("GST math (DR-023 inclusive pricing)", () => {
  it("₹1,499 inclusive @18% → base ₹1,270.34 + GST ₹228.66", () => {
    const b = gstFromInclusive(149900, 1800);
    expect(b.baseInPaise + b.gstInPaise).toBe(149900);
    expect(b.baseInPaise).toBe(127034);
  });
  it("rate 0 (D-03 not registered) → no GST", () => {
    expect(gstFromInclusive(149900, 0)).toEqual({
      totalInPaise: 149900,
      baseInPaise: 149900,
      gstInPaise: 0,
    });
  });
  it("rejects floats/negatives", () => {
    expect(() => gstFromInclusive(149900.5 as never, 1800)).toThrow();
    expect(() => gstFromInclusive(-1, 1800)).toThrow();
  });
});

describe("Razorpay signatures (Golden Rule 2)", () => {
  const secret = "test_secret";
  it("valid payment signature passes; tampered fails", () => {
    const sig = createHmac("sha256", secret)
      .update("order_1|pay_1")
      .digest("hex");
    expect(
      verifyPaymentSignature(
        {
          razorpayOrderId: "order_1",
          razorpayPaymentId: "pay_1",
          signature: sig,
        },
        secret,
      ),
    ).toBe(true);
    expect(
      verifyPaymentSignature(
        {
          razorpayOrderId: "order_1",
          razorpayPaymentId: "pay_2",
          signature: sig,
        },
        secret,
      ),
    ).toBe(false);
  });
  it("webhook raw-body signature verifies; wrong secret fails", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, "whsec")).toBe(true);
    expect(verifyWebhookSignature(body, sig, "wrong")).toBe(false);
    expect(verifyWebhookSignature(body, "not-hex!!", "whsec")).toBe(false);
  });
});

describe("Webhook decision flow", () => {
  const order: OrderState = {
    id: "o1",
    status: "CREATED",
    amountInPaise: 149900,
  };
  const paid: OrderState = { ...order, status: "PAID", paidAt };
  it("golden path: capture → MARK_PAID + ENROLL + CREDIT", () => {
    const d = decideWebhookActions(
      {
        kind: "payment.captured",
        orderId: "o1",
        paymentId: "p1",
        amountInPaise: 149900,
      },
      order,
      { alreadyProcessed: false },
    );
    expect(d.actions.map((a) => a.do)).toEqual([
      "MARK_PAID",
      "ENROLL",
      "CREDIT_COMMISSIONS",
    ]);
  });
  it("duplicate webhook → no actions (idempotent)", () => {
    expect(
      decideWebhookActions(
        {
          kind: "payment.captured",
          orderId: "o1",
          paymentId: "p1",
          amountInPaise: 149900,
        },
        order,
        { alreadyProcessed: true },
      ).actions,
    ).toEqual([]);
  });
  it("already-paid order → skip (no double credit)", () => {
    expect(
      decideWebhookActions(
        {
          kind: "payment.captured",
          orderId: "o1",
          paymentId: "p1",
          amountInPaise: 149900,
        },
        paid,
        { alreadyProcessed: false },
      ).actions,
    ).toEqual([]);
  });
  it("amount mismatch → manual review, NO credit", () => {
    const d = decideWebhookActions(
      {
        kind: "payment.captured",
        orderId: "o1",
        paymentId: "p1",
        amountInPaise: 99900,
      },
      order,
      { alreadyProcessed: false },
    );
    expect(d.actions).toHaveLength(1);
    expect(d.actions[0].do).toBe("FLAG_MANUAL_REVIEW");
  });
  it("refund within 48h → refund + revoke + CLAWBACK (DR-025)", () => {
    const d = decideWebhookActions(
      {
        kind: "refund.processed",
        orderId: "o1",
        refundId: "r1",
        amountInPaise: 149900,
      },
      paid,
      { alreadyProcessed: false, now: inWin },
    );
    expect(d.actions.map((a) => a.do)).toEqual([
      "MARK_REFUNDED",
      "REVOKE_ENROLLMENTS",
      "CLAWBACK_COMMISSIONS",
    ]);
  });
  it("refund after 48h → manual review, no auto-clawback (DR-025)", () => {
    const d = decideWebhookActions(
      {
        kind: "refund.processed",
        orderId: "o1",
        refundId: "r1",
        amountInPaise: 149900,
      },
      paid,
      { alreadyProcessed: false, now: afterWin },
    );
    expect(d.actions.map((a) => a.do)).toEqual([
      "MARK_REFUNDED",
      "REVOKE_ENROLLMENTS",
      "FLAG_MANUAL_REVIEW",
    ]);
  });
  it("M-3: PARTIAL refund → manual review only, NO clawback/revoke (even in-window)", () => {
    const d = decideWebhookActions(
      {
        kind: "refund.processed",
        orderId: "o1",
        refundId: "r1",
        amountInPaise: 50000, // partial (< 149900)
      },
      paid,
      { alreadyProcessed: false, now: inWin },
    );
    expect(d.actions).toHaveLength(1);
    expect(d.actions[0].do).toBe("FLAG_MANUAL_REVIEW");
    // Order is NOT marked refunded, enrollments NOT revoked, commissions NOT clawed back.
    expect(d.actions.map((a) => a.do)).not.toContain("MARK_REFUNDED");
    expect(d.actions.map((a) => a.do)).not.toContain("CLAWBACK_COMMISSIONS");
    expect(d.actions.map((a) => a.do)).not.toContain("REVOKE_ENROLLMENTS");
  });
});

describe("Upline resolution (DR-007)", () => {
  it("3 levels max, in order", () => {
    expect(resolveUplines("buyer", ["a", "b", "c", "d"])).toEqual([
      { userId: "a", level: 1 },
      { userId: "b", level: 2 },
      { userId: "c", level: 3 },
    ]);
  });
  it("stops on self-referral and cycles", () => {
    expect(resolveUplines("buyer", ["buyer", "a"])).toEqual([]);
    expect(resolveUplines("buyer", ["a", "b", "a"])).toEqual([
      { userId: "a", level: 1 },
      { userId: "b", level: 2 },
    ]);
  });
  it("shorter chains fine", () => {
    expect(resolveUplines("buyer", ["a"])).toEqual([{ userId: "a", level: 1 }]);
    expect(resolveUplines("buyer", [])).toEqual([]);
  });
});

describe("Commission credit builder (DR-007 + DR-025 hold)", () => {
  const txns = buildCommissionTxns({
    orderId: "o1",
    pkg: "career-booster",
    paidAt,
    uplines: resolveUplines("buyer", ["a", "b", "c"]),
  });
  it("3 balanced txns with correct amounts ₹1250/250/150", () => {
    expect(txns).toHaveLength(3);
    expect(txns.map((t) => t.legs[1].amountInPaise)).toEqual([
      125000, 25000, 15000,
    ]);
    for (const t of txns)
      expect(t.legs.reduce((s, l) => s + l.amountInPaise, 0)).toBe(0);
  });
  it("wallet legs HELD until paidAt+48h; payable legs unheld", () => {
    for (const t of txns) {
      expect(t.legs[1].holdUntil?.toISOString()).toBe(
        commissionHoldUntil(paidAt).toISOString(),
      );
      expect(t.legs[0].holdUntil).toBeUndefined();
    }
  });
  it("idempotency keys unique per (order, upline, level)", () => {
    expect(new Set(txns.map((t) => t.idempotencyKey)).size).toBe(3);
    expect(txns[0].idempotencyKey).toBe("commission:o1:a:1");
  });
});

describe("Clawback builder (DR-025)", () => {
  const credits = buildCommissionTxns({
    orderId: "o1",
    pkg: "skill-builder",
    paidAt,
    uplines: resolveUplines("buyer", ["a", "b"]),
  });
  const claws = buildClawbackTxns("o1", credits);
  it("mirrors each credit with negated, balanced legs", () => {
    expect(claws).toHaveLength(2);
    expect(claws[0].idempotencyKey).toBe("clawback:o1:a:1");
    expect(claws[0].type).toBe("CLAWBACK");
    for (let i = 0; i < claws.length; i++) {
      expect(claws[i].legs.reduce((s, l) => s + l.amountInPaise, 0)).toBe(0);
      const wallet = [credits[i].legs[1], claws[i].legs[1]];
      expect(availableBalanceOf(wallet, afterWin)).toBe(0); // never becomes available
    }
  });
});

describe("Entitlement (DR-021)", () => {
  const sb = {
    slug: "skill-builder" as const,
    includesFutureCourses: false,
    courseIds: ["ai", "dm"],
  };
  const cb = {
    slug: "career-booster" as const,
    includesFutureCourses: true,
    courseIds: ["ai", "dm"],
  };
  it("SB: requires valid course choice", () => {
    expect(coursesToEnroll(sb, "ai")).toEqual({ ok: true, courseIds: ["ai"] });
    expect(coursesToEnroll(sb, null).ok).toBe(false);
    expect(coursesToEnroll(sb, "stock").ok).toBe(false);
  });
  it("CB: all current courses + future auto-enroll", () => {
    expect(coursesToEnroll(cb)).toEqual({ ok: true, courseIds: ["ai", "dm"] });
    expect(autoEnrollOnPublish(cb)).toBe(true);
    expect(autoEnrollOnPublish(sb)).toBe(false);
  });
});

describe("Withdrawal rules (D-01 gate + bounds + held-exclusion)", () => {
  const base = {
    payoutsEnabled: true,
    kycStatus: "APPROVED" as const,
    hasPendingWithdrawal: false,
    availableInPaise: 100000,
    amountInPaise: 60000,
  };
  it("happy path ok", () =>
    expect(validateWithdrawal(base)).toEqual({ ok: true }));
  it("D-01 gate blocks everything first", () => {
    const r = validateWithdrawal({ ...base, payoutsEnabled: false });
    expect(r.ok === false && r.code).toBe("PAYOUTS_DISABLED");
  });
  it("KYC, single-pending, bounds, insufficient", () => {
    expect(
      (validateWithdrawal({ ...base, kycStatus: "SUBMITTED" }) as never)[
        "code"
      ],
    ).toBe("KYC_REQUIRED");
    expect(
      (validateWithdrawal({ ...base, hasPendingWithdrawal: true }) as never)[
        "code"
      ],
    ).toBe("PENDING_EXISTS");
    expect(
      (
        validateWithdrawal({
          ...base,
          amountInPaise: MIN_WITHDRAWAL_PAISE - 1,
        }) as never
      )["code"],
    ).toBe("BELOW_MIN");
    expect(
      (
        validateWithdrawal({
          ...base,
          amountInPaise: MAX_WITHDRAWAL_PAISE + 1,
        }) as never
      )["code"],
    ).toBe("ABOVE_MAX");
    expect(
      (validateWithdrawal({ ...base, amountInPaise: 100001 }) as never)["code"],
    ).toBe("INSUFFICIENT");
  });
});

describe("Wallet summary (DR-025 UX: held visible, locked)", () => {
  it("total/held/available/lifetime", () => {
    const hold = commissionHoldUntil(paidAt);
    const s = walletSummary(
      [
        { amountInPaise: 90000, holdUntil: hold },
        { amountInPaise: 40000, holdUntil: null },
        { amountInPaise: -20000, holdUntil: null }, // past payout
      ],
      inWin,
    );
    expect(s).toEqual({
      totalInPaise: 110000,
      heldInPaise: 90000,
      availableInPaise: 20000,
      lifetimeEarnedInPaise: 130000,
    });
  });
});
