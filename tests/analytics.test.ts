// Ticket 8 — analytics taxonomy (pure) + provider selection + fail-safe track(). No DB.
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  buildAnalyticsEvent,
  stripPii,
  funnelStepIndex,
  FUNNEL_STEPS,
  ANALYTICS_EVENTS,
} from "@/modules/analytics/events";
import { analyticsProviderName, assertProductionProviderSafety } from "@/lib/config/providers";
import { getAnalyticsProvider } from "@/lib/analytics/provider";
import { track } from "@/lib/analytics/track";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("event taxonomy (pure)", () => {
  it("builds a canonical envelope with an injected timestamp + default distinctId", () => {
    const e = buildAnalyticsEvent({ name: "purchase", distinctId: "", now: new Date("2026-07-03T00:00:00Z") });
    expect(e).toEqual({ name: "purchase", distinctId: "anonymous", properties: {}, timestamp: "2026-07-03T00:00:00.000Z" });
  });

  it("strips PII/secret-looking keys but keeps safe scalars", () => {
    const cleaned = stripPii({ phone: "9876543210", email: "a@b.c", name: "Asha", otp: "1234", package: "career-booster", amount_paise: 149900 });
    expect(cleaned).toEqual({ package: "career-booster", amount_paise: 149900 });
  });

  it("buildAnalyticsEvent applies the PII strip", () => {
    const e = buildAnalyticsEvent({ name: "webinar_registered", distinctId: "anon_x", properties: { phone: "9999999999", utm_source: "insta" }, now: new Date(0) });
    expect(e.properties).toEqual({ utm_source: "insta" });
  });

  it("orders the funnel and returns -1 for non-funnel events", () => {
    expect(funnelStepIndex("begin_checkout")).toBe(FUNNEL_STEPS.indexOf("begin_checkout"));
    expect(funnelStepIndex("purchase")).toBeGreaterThan(funnelStepIndex("begin_checkout"));
    expect(funnelStepIndex("webinar_registered")).toBe(-1);
    expect(ANALYTICS_EVENTS).toContain("purchase");
  });
});

describe("analytics provider selection", () => {
  it("defaults to console when unset", () => {
    vi.stubEnv("ANALYTICS_PROVIDER", "");
    expect(analyticsProviderName()).toBe("console");
  });
  it("selects posthog when configured", () => {
    vi.stubEnv("ANALYTICS_PROVIDER", "posthog");
    expect(analyticsProviderName()).toBe("posthog");
  });
  it("rejects invalid values", () => {
    vi.stubEnv("ANALYTICS_PROVIDER", "mixpanel");
    expect(() => analyticsProviderName()).toThrow(/Invalid ANALYTICS_PROVIDER/);
  });
});

describe("analytics is EXCLUDED from the hard production guard", () => {
  it("console-in-production soft-warns (never throws) and still returns the console provider", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANALYTICS_PROVIDER", "console");
    let provider!: ReturnType<typeof getAnalyticsProvider>;
    expect(() => (provider = getAnalyticsProvider())).not.toThrow();
    expect(provider.name).toBe("console");
    getAnalyticsProvider(); // second call — warns at most once
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/ANALYTICS_PROVIDER=console in production/);
  });

  it("assertProductionProviderSafety() does NOT throw for console analytics in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "razorpay");
    vi.stubEnv("OTP_PROVIDER", "live");
    vi.stubEnv("VIDEO_PROVIDER", "stream");
    vi.stubEnv("ANALYTICS_PROVIDER", "console");
    expect(() => assertProductionProviderSafety()).not.toThrow();
  });
});

describe("console provider + track()", () => {
  it("emits one structured JSON line (PII pre-stripped) and never throws", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ANALYTICS_PROVIDER", "console");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await track("purchase", "user-1", { order_id: "ord_1", amount_paise: 149900, phone: "9876543210" });
    expect(log).toHaveBeenCalledTimes(1);
    const line = JSON.parse(log.mock.calls[0][0] as string);
    expect(line.analytics).toBe("purchase");
    expect(line.distinctId).toBe("user-1");
    expect(line.amount_paise).toBe(149900);
    expect(line.phone).toBeUndefined(); // PII never logged
  });

  it("track() is fail-safe: a broken sink degrades silently (does not throw)", async () => {
    // posthog selected but POSTHOG_API_KEY missing → capture throws inside; track must swallow.
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ANALYTICS_PROVIDER", "posthog");
    vi.stubEnv("POSTHOG_API_KEY", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(track("purchase", "user-1", { order_id: "ord_1" })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/capture failed for "purchase"/);
  });
});
