// DR-030 §2 — first-touch referral cookie sanitizer (pure). No DB, no request scope.
import { describe, it, expect } from "vitest";
import { sanitizeRefCode } from "@/lib/auth/ref-cookie";

describe("sanitizeRefCode", () => {
  it("uppercases and strips non-alphanumerics from a valid code", () => {
    expect(sanitizeRefCode("gs1a2b3c")).toBe("GS1A2B3C");
    expect(sanitizeRefCode(" gs-1a2b ")).toBe("GS1A2B");
  });

  it("rejects empty, missing, and too-short values", () => {
    expect(sanitizeRefCode(null)).toBeNull();
    expect(sanitizeRefCode(undefined)).toBeNull();
    expect(sanitizeRefCode("")).toBeNull();
    expect(sanitizeRefCode("  ")).toBeNull();
    expect(sanitizeRefCode("ab")).toBeNull(); // < 3 chars after cleaning
  });

  it("rejects an over-long value (junk / injection guard)", () => {
    expect(sanitizeRefCode("A".repeat(25))).toBeNull();
    expect(sanitizeRefCode("A".repeat(24))).toBe("A".repeat(24)); // boundary ok
  });

  it("drops symbols entirely, keeping only [A-Z0-9]", () => {
    expect(sanitizeRefCode("<script>gsX1")).toBe("SCRIPTGSX1");
    expect(sanitizeRefCode("!!!")).toBeNull();
  });
});
