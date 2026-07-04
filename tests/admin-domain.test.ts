// GPS-M4 pure admin-domain rules — state machines + the payout TxSpec. No DB.
import { describe, it, expect } from "vitest";
import {
  decideKycReview,
  evaluatePayoutFlagFlip,
  canPublishCourse,
  ENABLE_PHRASE,
  DISABLE_PHRASE,
} from "@/modules/admin/review";
import {
  canMarkWithdrawalPaid,
  buildPayoutTxSpec,
  payoutIdempotencyKey,
} from "@/modules/wallet/withdrawal";
import { assertBalanced } from "@/modules/ledger/ledger";

describe("decideKycReview", () => {
  it("approves a submitted record", () => {
    const r = decideKycReview("SUBMITTED", "APPROVE");
    expect(r).toEqual({ ok: true, nextStatus: "APPROVED" });
  });
  it("rejects with a reason", () => {
    expect(decideKycReview("SUBMITTED", "REJECT", "blurry PAN").ok).toBe(true);
  });
  it("requires a reason to reject", () => {
    const r = decideKycReview("SUBMITTED", "REJECT", "  ");
    expect(r.ok).toBe(false);
  });
  it("refuses to re-review a non-submitted record", () => {
    expect(decideKycReview("APPROVED", "REJECT", "x").ok).toBe(false);
    expect(decideKycReview("DRAFT", "APPROVE").ok).toBe(false);
  });
});

describe("evaluatePayoutFlagFlip", () => {
  it("enables when LC #1 final + phrase correct", () => {
    const r = evaluatePayoutFlagFlip({
      direction: "ENABLE",
      currentlyEnabled: false,
      lcOneFinal: true,
      typedConfirmation: ENABLE_PHRASE,
    });
    expect(r).toEqual({ ok: true, action: "PAYOUTS_ENABLED" });
  });
  it("blocks enable while LC #1 is not final (precondition)", () => {
    const r = evaluatePayoutFlagFlip({
      direction: "ENABLE",
      currentlyEnabled: false,
      lcOneFinal: false,
      typedConfirmation: ENABLE_PHRASE,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("LC1_NOT_FINAL");
  });
  it("disables (emergency) regardless of LC #1 with the phrase", () => {
    const r = evaluatePayoutFlagFlip({
      direction: "DISABLE",
      currentlyEnabled: true,
      lcOneFinal: false,
      typedConfirmation: DISABLE_PHRASE,
    });
    expect(r).toEqual({ ok: true, action: "PAYOUTS_DISABLED" });
  });
  it("requires the exact confirmation phrase", () => {
    const r = evaluatePayoutFlagFlip({
      direction: "ENABLE",
      currentlyEnabled: false,
      lcOneFinal: true,
      typedConfirmation: "enable payouts",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("CONFIRMATION_MISMATCH");
  });
  it("no-ops when already in the target state", () => {
    const r = evaluatePayoutFlagFlip({
      direction: "ENABLE",
      currentlyEnabled: true,
      lcOneFinal: true,
      typedConfirmation: ENABLE_PHRASE,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("NO_CHANGE");
  });
});

describe("canPublishCourse", () => {
  it("blocks with no modules", () => {
    expect(canPublishCourse([]).ok).toBe(false);
  });
  it("blocks when no lesson has a video asset", () => {
    expect(
      canPublishCourse([{ lessons: [{ videoAssetId: null }] }]).ok,
    ).toBe(false);
  });
  it("allows with a video lesson", () => {
    expect(
      canPublishCourse([{ lessons: [{ videoAssetId: "uid-123" }] }]).ok,
    ).toBe(true);
  });
});

describe("canMarkWithdrawalPaid", () => {
  const base = {
    status: "APPLIED" as const,
    kycApproved: true,
    availableInPaise: 100_000,
    amountInPaise: 50_000,
  };
  it("allows a valid APPLIED withdrawal", () => {
    expect(canMarkWithdrawalPaid(base).ok).toBe(true);
  });
  it("hard-stops when the balance dropped below the amount", () => {
    const r = canMarkWithdrawalPaid({ ...base, availableInPaise: 40_000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("BALANCE_CHANGED");
  });
  it("refuses without approved KYC", () => {
    expect(canMarkWithdrawalPaid({ ...base, kycApproved: false }).ok).toBe(false);
  });
  it("treats an already-PAID row as not markable", () => {
    const r = canMarkWithdrawalPaid({ ...base, status: "PAID" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("ALREADY_PAID");
  });
});

describe("buildPayoutTxSpec", () => {
  it("builds a balanced, idempotent PAYOUT: wallet debit ↔ clearing credit", () => {
    const spec = buildPayoutTxSpec({
      withdrawalId: "w1",
      userId: "u1",
      amountInPaise: 50_000,
    });
    expect(spec.type).toBe("PAYOUT");
    expect(spec.idempotencyKey).toBe(payoutIdempotencyKey("w1"));
    expect(() => assertBalanced(spec.legs)).not.toThrow();
    const wallet = spec.legs.find(
      (l) => l.account.kind === "USER_WALLET",
    );
    const clearing = spec.legs.find(
      (l) => l.account.kind === "PAYOUT_CLEARING",
    );
    expect(wallet?.amountInPaise).toBe(-50_000);
    expect(clearing?.amountInPaise).toBe(50_000);
    expect(wallet?.holdUntil ?? null).toBeNull();
  });
});
