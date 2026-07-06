import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  assertProductionProviderSafety,
  isStagingMode,
  showStagingBanner,
} from "@/lib/config/providers";
import {
  getPaymentProvider,
  mockPaymentProvider,
} from "@/lib/payments/provider";

// Staging mode is the money safety rail: a production build may boot with mock payment/OTP/video
// ONLY on a non-prod host explicitly flagged APP_ENV=staging. These tests pin every branch —
// especially that the prod domain can NEVER simulate money.

const KEYS = [
  "NODE_ENV",
  "APP_ENV",
  "NEXT_PUBLIC_APP_URL",
  "PAYMENT_PROVIDER",
  "OTP_PROVIDER",
  "VIDEO_PROVIDER",
] as const;

const STAGING_URL = "https://test.goskilled.in";
const PROD_URL = "https://goskilled.in";
const WWW_PROD_URL = "https://www.goskilled.in";
const THROWS = /development providers enabled in production/i;

// Mutable view: process.env types NODE_ENV as read-only, but at runtime it is freely assignable.
const ENV = process.env as Record<string, string | undefined>;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of KEYS) saved[k] = ENV[k];
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete ENV[k];
    else ENV[k] = saved[k];
  }
  vi.restoreAllMocks();
});

/** Replace exactly the KEYS we control; unset providers then default to mock/test in the getters. */
function setEnv(env: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const k of KEYS) delete ENV[k];
  for (const [k, v] of Object.entries(env)) ENV[k] = v;
}

describe("staging mode — production provider safety rail", () => {
  it("prod + mock providers + NO flag → hard-throws (unchanged strict behaviour)", () => {
    setEnv({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: STAGING_URL }); // defaults: mock/test/mock
    expect(isStagingMode()).toBe(false);
    expect(() => assertProductionProviderSafety()).toThrow(THROWS);
  });

  it("prod + APP_ENV=staging + non-prod host + mock → warns loudly and BOOTS", async () => {
    setEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: STAGING_URL,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Fresh module → its import-time boot guard runs under the staging env and warns.
    vi.resetModules();
    const providers = await import("@/lib/config/providers");
    expect(warn).toHaveBeenCalled(); // loud boot warning
    expect(providers.isStagingMode()).toBe(true);
    expect(() => providers.assertProductionProviderSafety()).not.toThrow(); // boots
  });

  it("HARD RULE: APP_ENV=staging on the prod host → STILL hard-throws", () => {
    setEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: PROD_URL,
    });
    expect(isStagingMode()).toBe(false);
    expect(showStagingBanner()).toBe(false); // banner never on the prod domain
    expect(() => assertProductionProviderSafety()).toThrow(THROWS);
  });

  it("HARD RULE: APP_ENV=staging on www.goskilled.in → STILL hard-throws", () => {
    setEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: WWW_PROD_URL,
    });
    expect(isStagingMode()).toBe(false);
    expect(() => assertProductionProviderSafety()).toThrow(THROWS);
  });

  it("fail-closed: APP_ENV=staging but NEXT_PUBLIC_APP_URL unset → NOT staging → throws", () => {
    setEnv({ NODE_ENV: "production", APP_ENV: "staging" }); // no host = no proof of non-prod
    expect(isStagingMode()).toBe(false);
    expect(() => assertProductionProviderSafety()).toThrow(THROWS);
  });

  it("fail-closed: APP_ENV=staging + unparseable host → NOT staging → throws", () => {
    setEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: "not a url",
    });
    expect(isStagingMode()).toBe(false);
    expect(() => assertProductionProviderSafety()).toThrow(THROWS);
  });

  it("dev (NODE_ENV!=production) → unchanged: mocks boot, staging not engaged, no banner by default", () => {
    setEnv({ NODE_ENV: "development" });
    expect(() => assertProductionProviderSafety()).not.toThrow();
    expect(isStagingMode()).toBe(false); // staging is production-only
    expect(showStagingBanner()).toBe(false); // no APP_ENV → no banner
  });

  it("staging opens NO real-money path — payment provider stays the mock, never Razorpay", () => {
    setEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: STAGING_URL,
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = getPaymentProvider(); // must not throw in staging
    expect(provider.name).toBe("mock");
    expect(provider).toBe(mockPaymentProvider); // identity: the no-network mock, not Razorpay
  });

  it("banner shows in the canonical staging config, hidden without the flag", () => {
    setEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: STAGING_URL,
    });
    expect(showStagingBanner()).toBe(true);
    setEnv({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: STAGING_URL });
    expect(showStagingBanner()).toBe(false);
  });
});
