// Launch hardening Unit 4 — comprehensive coverage of the withdrawal gate ordering (non-regression,
// pure; asserts EXISTING behaviour of validateWithdrawal — no money-logic change). Every rejection
// code + the precedence order (payouts → KYC → pending → amount validity → min → max → available).
import { describe, it, expect } from "vitest";
import {
  validateWithdrawal,
  MIN_WITHDRAWAL_PAISE,
  MAX_WITHDRAWAL_PAISE,
} from "@/modules/wallet/withdrawal";

const ok = {
  payoutsEnabled: true,
  kycStatus: "APPROVED" as const,
  hasPendingWithdrawal: false,
  availableInPaise: 1_000_000,
  amountInPaise: 100_000,
};

describe("validateWithdrawal — happy path", () => {
  it("passes a valid request", () => {
    expect(validateWithdrawal(ok).ok).toBe(true);
  });
  it("min and max are ₹500 / ₹25,000 (boundaries inclusive, with sufficient balance)", () => {
    expect(MIN_WITHDRAWAL_PAISE).toBe(50_000);
    expect(MAX_WITHDRAWAL_PAISE).toBe(2_500_000);
    const rich = { ...ok, availableInPaise: 5_000_000 }; // enough to cover the max
    expect(
      validateWithdrawal({ ...rich, amountInPaise: MIN_WITHDRAWAL_PAISE }).ok,
    ).toBe(true);
    expect(
      validateWithdrawal({ ...rich, amountInPaise: MAX_WITHDRAWAL_PAISE }).ok,
    ).toBe(true);
  });
});

describe("validateWithdrawal — rejection codes + precedence", () => {
  const code = (c: Parameters<typeof validateWithdrawal>[0]) => {
    const r = validateWithdrawal(c);
    return r.ok ? "OK" : r.code;
  };

  it("payouts OFF wins over everything (checked first)", () => {
    // Even with every other field also invalid, PAYOUTS_DISABLED is returned first.
    expect(
      code({
        payoutsEnabled: false,
        kycStatus: "DRAFT",
        hasPendingWithdrawal: true,
        availableInPaise: 0,
        amountInPaise: 999_999_999,
      }),
    ).toBe("PAYOUTS_DISABLED");
  });
  it("KYC not approved → KYC_REQUIRED (before pending/amount)", () => {
    expect(
      code({ ...ok, kycStatus: "SUBMITTED", hasPendingWithdrawal: true }),
    ).toBe("KYC_REQUIRED");
    expect(code({ ...ok, kycStatus: "DRAFT" })).toBe("KYC_REQUIRED");
    expect(code({ ...ok, kycStatus: "REJECTED" })).toBe("KYC_REQUIRED");
  });
  it("existing pending → PENDING_EXISTS (before amount checks)", () => {
    expect(code({ ...ok, hasPendingWithdrawal: true, amountInPaise: 0 })).toBe(
      "PENDING_EXISTS",
    );
  });
  it("non-integer / non-positive → INVALID_AMOUNT", () => {
    expect(code({ ...ok, amountInPaise: 0 })).toBe("INVALID_AMOUNT");
    expect(code({ ...ok, amountInPaise: -100 })).toBe("INVALID_AMOUNT");
    expect(code({ ...ok, amountInPaise: 100.5 })).toBe("INVALID_AMOUNT");
  });
  it("below ₹500 → BELOW_MIN", () => {
    expect(code({ ...ok, amountInPaise: MIN_WITHDRAWAL_PAISE - 1 })).toBe(
      "BELOW_MIN",
    );
  });
  it("above ₹25,000 → ABOVE_MAX (even if available is huge)", () => {
    expect(
      code({
        ...ok,
        amountInPaise: MAX_WITHDRAWAL_PAISE + 1,
        availableInPaise: 9_000_000,
      }),
    ).toBe("ABOVE_MAX");
  });
  it("exceeds AVAILABLE → INSUFFICIENT (held balance never counts)", () => {
    expect(
      code({ ...ok, amountInPaise: 200_000, availableInPaise: 100_000 }),
    ).toBe("INSUFFICIENT");
  });
});
