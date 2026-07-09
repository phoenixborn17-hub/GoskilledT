// Phase A (DR-036 §6) — password policy. Pure, no Supabase, no request context.
import { describe, it, expect, afterEach } from "vitest";
import { passwordIssue, minPasswordLength } from "@/lib/auth/password";

const ENV = process.env as Record<string, string | undefined>;

afterEach(() => {
  delete ENV.MIN_PASSWORD_LENGTH;
});

describe("password policy", () => {
  it("defaults to a minimum of 8 characters", () => {
    expect(minPasswordLength()).toBe(8);
    expect(passwordIssue("1234567")).toMatch(/at least 8/i);
    expect(passwordIssue("12345678")).toBeNull();
  });

  it("honours a configured MIN_PASSWORD_LENGTH (LAUNCH_CONFIG) when >= 8", () => {
    ENV.MIN_PASSWORD_LENGTH = "12";
    expect(minPasswordLength()).toBe(12);
    expect(passwordIssue("12345678")).toMatch(/at least 12/i);
    expect(passwordIssue("123456789012")).toBeNull();
  });

  it("never drops below the 8-char floor even if misconfigured lower", () => {
    ENV.MIN_PASSWORD_LENGTH = "4";
    expect(minPasswordLength()).toBe(8);
  });

  it("rejects non-strings defensively", () => {
    expect(passwordIssue(undefined as unknown as string)).toMatch(/at least/i);
  });
});
