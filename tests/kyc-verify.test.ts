// Phase C §3 — contact verification pure domain (no DB).
import { describe, it, expect } from "vitest";
import {
  hashVerificationCode,
  checkVerification,
  isValidEmail,
  normalizeWhatsapp,
} from "@/modules/kyc/verify";

const NOW = new Date("2026-07-10T12:00:00Z");
const soon = new Date(NOW.getTime() + 60_000);
const past = new Date(NOW.getTime() - 60_000);

describe("hashVerificationCode", () => {
  it("is deterministic and hides the raw code", () => {
    expect(hashVerificationCode("123456")).toBe(
      hashVerificationCode(" 123456 "),
    );
    expect(hashVerificationCode("123456")).not.toContain("123456");
    expect(hashVerificationCode("123456")).not.toBe(
      hashVerificationCode("000000"),
    );
  });
});

describe("checkVerification", () => {
  const rec = (
    over: Partial<{
      codeHash: string;
      target: string;
      expiresAt: Date;
      consumedAt: Date | null;
    }> = {},
  ) => ({
    codeHash: hashVerificationCode("123456"),
    target: "a@b.com",
    expiresAt: soon,
    consumedAt: null,
    ...over,
  });

  it("accepts a correct, unexpired, unconsumed code for the right target", () => {
    expect(checkVerification(rec(), "123456", "a@b.com", NOW).ok).toBe(true);
  });
  it("rejects a wrong code", () => {
    const r = checkVerification(rec(), "000000", "a@b.com", NOW);
    expect(r.ok).toBe(false);
  });
  it("rejects an expired code", () => {
    expect(
      checkVerification(rec({ expiresAt: past }), "123456", "a@b.com", NOW).ok,
    ).toBe(false);
  });
  it("rejects an already-consumed code", () => {
    expect(
      checkVerification(rec({ consumedAt: past }), "123456", "a@b.com", NOW).ok,
    ).toBe(false);
  });
  it("rejects a code issued for a different target", () => {
    expect(checkVerification(rec(), "123456", "other@b.com", NOW).ok).toBe(
      false,
    );
  });
});

describe("target validation", () => {
  it("isValidEmail", () => {
    expect(isValidEmail("x@y.com")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });
  it("normalizeWhatsapp → +91XXXXXXXXXX or null", () => {
    expect(normalizeWhatsapp("98765 43210")).toBe("+919876543210");
    expect(normalizeWhatsapp("+91 9876543210")).toBe("+919876543210");
    expect(normalizeWhatsapp("12345")).toBeNull();
  });
});
