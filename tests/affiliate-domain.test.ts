import { describe, it, expect } from "vitest";
import {
  isValidPan,
  isValidIfsc,
  isValidAccountNumber,
  kycUiStatus,
} from "@/modules/kyc/kyc";
import { validateWithdrawal } from "@/modules/wallet/withdrawal";
import { walletSummary } from "@/modules/wallet/summary";
import { AFFILIATE_COPY } from "@/lib/affiliate/copy";

describe("KYC field validation", () => {
  it("PAN", () => {
    expect(isValidPan("ABCDE1234F")).toBe(true);
    expect(isValidPan("abcde1234f")).toBe(true); // uppercased in isValidPan
    expect(isValidPan("ABCD1234F")).toBe(false);
    expect(isValidPan("ABCDE12345")).toBe(false);
  });
  it("IFSC", () => {
    expect(isValidIfsc("SBIN0001234")).toBe(true);
    expect(isValidIfsc("SBIN1001234")).toBe(false); // 5th char must be 0
    expect(isValidIfsc("SB0N0001234")).toBe(false);
  });
  it("account number", () => {
    expect(isValidAccountNumber("123456789")).toBe(true); // 9
    expect(isValidAccountNumber("123456789012345678")).toBe(true); // 18
    expect(isValidAccountNumber("12345678")).toBe(false); // 8
    expect(isValidAccountNumber("12345678a")).toBe(false);
  });
  it("status → UI state", () => {
    expect(kycUiStatus(null)).toBe("NOT_SUBMITTED");
    expect(kycUiStatus("DRAFT")).toBe("NOT_SUBMITTED");
    expect(kycUiStatus("SUBMITTED")).toBe("UNDER_REVIEW");
    expect(kycUiStatus("APPROVED")).toBe("VERIFIED");
    expect(kycUiStatus("REJECTED")).toBe("REJECTED");
  });
});

describe("D-29 sweep — flag-OFF affiliate copy has zero ₹/earnings language", () => {
  it("AFFILIATE_COPY is clean", () => {
    const blob = JSON.stringify(AFFILIATE_COPY);
    expect(blob).not.toContain("₹");
    // \bearn matches "earn/earnings/earn ₹" but NOT "learn/learning"; also no income framing.
    expect(blob).not.toMatch(
      /\bearn|\bincome|\breward|guarantee|\blakh|per month|per day|%/i,
    );
  });
});

describe("withdrawal gating — both flag states", () => {
  const base = {
    kycStatus: "APPROVED" as const,
    hasPendingWithdrawal: false,
    availableInPaise: 100_000, // ₹1,000 available
    amountInPaise: 60_000, // ₹600
  };

  it("flag OFF → blocked regardless of everything else", () => {
    const r = validateWithdrawal({ ...base, payoutsEnabled: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PAYOUTS_DISABLED");
  });

  it("flag ON + KYC not approved → KYC_REQUIRED", () => {
    const r = validateWithdrawal({
      ...base,
      payoutsEnabled: true,
      kycStatus: "SUBMITTED",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("KYC_REQUIRED");
  });

  it("flag ON + pending → PENDING_EXISTS", () => {
    const r = validateWithdrawal({
      ...base,
      payoutsEnabled: true,
      hasPendingWithdrawal: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("PENDING_EXISTS");
  });

  it("flag ON + amount > available → INSUFFICIENT (held is never withdrawable)", () => {
    const r = validateWithdrawal({
      ...base,
      payoutsEnabled: true,
      amountInPaise: 150_000,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INSUFFICIENT");
  });

  it("flag ON + all rules met → ok", () => {
    expect(validateWithdrawal({ ...base, payoutsEnabled: true }).ok).toBe(true);
  });
});

describe("wallet math from ledger fixtures (held/available/clawback/adjustment)", () => {
  const now = new Date("2026-07-04T00:00:00Z");
  const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // still in hold window
  const past = new Date(now.getTime() - 1000); // cleared

  it("clawback nets held to 0; post-window adjustment nets available", () => {
    const entries = [
      { amountInPaise: 90_000, holdUntil: future }, // L1 commission — HELD
      { amountInPaise: 15_000, holdUntil: past }, // cleared → AVAILABLE
      { amountInPaise: -90_000, holdUntil: future }, // clawback (same holdUntil) → nets held
      { amountInPaise: -5_000, holdUntil: null }, // post-window ADJUSTMENT → nets available
    ];
    const s = walletSummary(entries, now);
    expect(s.heldInPaise).toBe(0); // held credit fully clawed back
    expect(s.availableInPaise).toBe(10_000); // 15,000 − 5,000
    expect(s.totalInPaise).toBe(10_000);
    expect(s.lifetimeEarnedInPaise).toBe(105_000); // sum of positive credits ever
  });
});
