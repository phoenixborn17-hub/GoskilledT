// Provider selection + the production safety guard (Ticket 3).
// Every external dependency (payments, OTP) is chosen by env so switching to production
// = env change + credentials, never a code rewrite. Mocks/test modes are FORBIDDEN in
// production: importing this module runs the guard, so the app fails fast at startup.

export type PaymentProviderName = "mock" | "razorpay";
export type OtpProviderName = "test" | "live";
export type VideoProviderName = "mock" | "stream";
export type AnalyticsProviderName = "console" | "posthog";

export function paymentProviderName(): PaymentProviderName {
  const v = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase(); // empty/unset → dev default
  if (v !== "mock" && v !== "razorpay") throw new Error(`Invalid PAYMENT_PROVIDER: "${v}" (expected mock|razorpay)`);
  return v;
}

export function otpProviderName(): OtpProviderName {
  const v = (process.env.OTP_PROVIDER || "test").toLowerCase(); // empty/unset → dev default
  if (v !== "test" && v !== "live") throw new Error(`Invalid OTP_PROVIDER: "${v}" (expected test|live)`);
  return v;
}

export function videoProviderName(): VideoProviderName {
  const v = (process.env.VIDEO_PROVIDER || "mock").toLowerCase(); // empty/unset → dev default
  if (v !== "mock" && v !== "stream") throw new Error(`Invalid VIDEO_PROVIDER: "${v}" (expected mock|stream)`);
  return v;
}

export function analyticsProviderName(): AnalyticsProviderName {
  const v = (process.env.ANALYTICS_PROVIDER || "console").toLowerCase(); // empty/unset → dev default
  if (v !== "console" && v !== "posthog") throw new Error(`Invalid ANALYTICS_PROVIDER: "${v}" (expected console|posthog)`);
  return v;
}

/** True when a development/mock provider is active for any dependency. */
export function usingDevProviders(): boolean {
  return paymentProviderName() === "mock" || otpProviderName() === "test" || videoProviderName() === "mock";
}

/**
 * Fail immediately if production is booting with any mock/test provider.
 * Called at import time (startup) AND inside every provider getter (defence in depth).
 */
export function assertProductionProviderSafety(): void {
  if (process.env.NODE_ENV !== "production") return;
  const offenders: string[] = [];
  if (paymentProviderName() === "mock") offenders.push("PAYMENT_PROVIDER=mock");
  if (otpProviderName() === "test") offenders.push("OTP_PROVIDER=test");
  if (videoProviderName() === "mock") offenders.push("VIDEO_PROVIDER=mock");
  if (offenders.length > 0) {
    throw new Error(
      `FATAL: development providers enabled in production (${offenders.join(", ")}). ` +
        `Set PAYMENT_PROVIDER=razorpay, OTP_PROVIDER=live and VIDEO_PROVIDER=stream with real credentials before deploying.`,
    );
  }
}

let warnedAnalytics = false;

/**
 * Analytics is the ONE deliberate EXCEPTION to the production provider guard (Ticket 8): running
 * `console` in production is degraded (no funnel data) but NOT unsafe — money still moves, PII is
 * still protected. So we WARN instead of throwing, and this is intentionally kept OUT of
 * assertProductionProviderSafety(). Called by getAnalyticsProvider(); warns once.
 */
export function softWarnProductionAnalytics(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (analyticsProviderName() !== "console") return;
  if (warnedAnalytics) return;
  warnedAnalytics = true;
  console.warn(
    "[analytics] WARNING: ANALYTICS_PROVIDER=console in production — funnel analytics are NOT being captured. " +
      "Set ANALYTICS_PROVIDER=posthog with POSTHOG_API_KEY to enable.",
  );
}

// Startup guard — importing this module anywhere enforces it. (Analytics is intentionally
// excluded here; see softWarnProductionAnalytics above.)
assertProductionProviderSafety();
