import { describe, it, expect, vi } from "vitest";
import { envIssues, validateEnv } from "@/lib/env";

// A minimal, valid DEV environment (mock/test/console providers → no secrets required).
const DEV_BASE: NodeJS.ProcessEnv = {
  DATABASE_URL: "postgresql://u:p@host:5432/postgres",
  DIRECT_URL: "postgresql://u:p@host:5432/postgres",
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  NODE_ENV: "development",
};

const PII_KEY_32 = Buffer.alloc(32, 7).toString("base64"); // valid 32-byte base64 key

describe("env schema", () => {
  it("accepts a valid dev config with default (mock) providers", () => {
    expect(envIssues(DEV_BASE)).toEqual([]);
  });

  it("flags missing base infrastructure vars", () => {
    const { DATABASE_URL, ...noDb } = DEV_BASE;
    void DATABASE_URL;
    expect(envIssues(noDb).some((i) => i.startsWith("DATABASE_URL"))).toBe(
      true,
    );
  });

  it("requires Razorpay secrets when PAYMENT_PROVIDER=razorpay", () => {
    const issues = envIssues({ ...DEV_BASE, PAYMENT_PROVIDER: "razorpay" });
    expect(issues.some((i) => i.startsWith("RAZORPAY_KEY_ID"))).toBe(true);
    expect(issues.some((i) => i.startsWith("RAZORPAY_KEY_SECRET"))).toBe(true);
    expect(issues.some((i) => i.startsWith("RAZORPAY_WEBHOOK_SECRET"))).toBe(
      true,
    );
  });

  it("requires MSG91 for live OTP, Cloudflare for stream, PostHog for posthog", () => {
    const otp = envIssues({ ...DEV_BASE, OTP_PROVIDER: "live" });
    expect(otp.some((i) => i.startsWith("MSG91_AUTH_KEY"))).toBe(true);
    const video = envIssues({ ...DEV_BASE, VIDEO_PROVIDER: "stream" });
    expect(
      video.some((i) => i.startsWith("CLOUDFLARE_STREAM_CUSTOMER_CODE")),
    ).toBe(true);
    const analytics = envIssues({ ...DEV_BASE, ANALYTICS_PROVIDER: "posthog" });
    expect(analytics.some((i) => i.startsWith("POSTHOG_API_KEY"))).toBe(true);
  });

  it("requires a well-formed PII_ENCRYPTION_KEY in production", () => {
    const missing = envIssues({ ...DEV_BASE, NODE_ENV: "production" });
    expect(missing.some((i) => i.startsWith("PII_ENCRYPTION_KEY"))).toBe(true);
    const badFormat = envIssues({
      ...DEV_BASE,
      PII_ENCRYPTION_KEY: "too-short",
    });
    expect(badFormat.some((i) => i.startsWith("PII_ENCRYPTION_KEY"))).toBe(
      true,
    );
    const ok = envIssues({
      ...DEV_BASE,
      NODE_ENV: "production",
      PII_ENCRYPTION_KEY: PII_KEY_32,
      EMAIL_UNSUBSCRIBE_SECRET: "prod-unsub-secret",
    });
    expect(ok).toEqual([]);
  });

  it("requires EMAIL_UNSUBSCRIBE_SECRET in production, not in dev (DR-031 security)", () => {
    // Prod boot without the secret → flagged (validateEnv throws on this).
    const missing = envIssues({
      ...DEV_BASE,
      NODE_ENV: "production",
      PII_ENCRYPTION_KEY: PII_KEY_32,
    });
    expect(missing.some((i) => i.startsWith("EMAIL_UNSUBSCRIBE_SECRET"))).toBe(
      true,
    );
    // Dev without the secret is fine (unsubscribeKey derives from DATABASE_URL locally).
    expect(
      envIssues(DEV_BASE).some((i) => i.startsWith("EMAIL_UNSUBSCRIBE_SECRET")),
    ).toBe(false);
  });

  it("validateEnv throws in production, warns in dev", () => {
    expect(() => validateEnv({ ...DEV_BASE, NODE_ENV: "production" })).toThrow(
      /environment validation failed/i,
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Dev config with a problem (razorpay selected, no keys) → warns, does not throw.
    expect(() =>
      validateEnv({ ...DEV_BASE, PAYMENT_PROVIDER: "razorpay" }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
