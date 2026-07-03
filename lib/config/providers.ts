// Provider selection + the production safety guard (Ticket 3).
// Every external dependency (payments, OTP) is chosen by env so switching to production
// = env change + credentials, never a code rewrite. Mocks/test modes are FORBIDDEN in
// production: importing this module runs the guard, so the app fails fast at startup.

export type PaymentProviderName = "mock" | "razorpay";
export type OtpProviderName = "test" | "live";

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

/** True when a development/mock provider is active for either dependency. */
export function usingDevProviders(): boolean {
  return paymentProviderName() === "mock" || otpProviderName() === "test";
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
  if (offenders.length > 0) {
    throw new Error(
      `FATAL: development providers enabled in production (${offenders.join(", ")}). ` +
        `Set PAYMENT_PROVIDER=razorpay and OTP_PROVIDER=live with real credentials before deploying.`,
    );
  }
}

// Startup guard — importing this module anywhere enforces it.
assertProductionProviderSafety();
