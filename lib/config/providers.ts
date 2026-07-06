// Provider selection + the production safety guard (Ticket 3).
// Every external dependency (payments, OTP) is chosen by env so switching to production
// = env change + credentials, never a code rewrite. Mocks/test modes are FORBIDDEN in
// production: importing this module runs the guard, so the app fails fast at startup.

export type PaymentProviderName = "mock" | "razorpay";
export type OtpProviderName = "test" | "live";
export type VideoProviderName = "mock" | "stream";
export type AnalyticsProviderName = "console" | "posthog";
export type EmailProviderName = "console" | "resend";
export type AiProviderName = "mock" | "live";

export function paymentProviderName(): PaymentProviderName {
  const v = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase(); // empty/unset → dev default
  if (v !== "mock" && v !== "razorpay")
    throw new Error(
      `Invalid PAYMENT_PROVIDER: "${v}" (expected mock|razorpay)`,
    );
  return v;
}

export function otpProviderName(): OtpProviderName {
  const v = (process.env.OTP_PROVIDER || "test").toLowerCase(); // empty/unset → dev default
  if (v !== "test" && v !== "live")
    throw new Error(`Invalid OTP_PROVIDER: "${v}" (expected test|live)`);
  return v;
}

export function videoProviderName(): VideoProviderName {
  const v = (process.env.VIDEO_PROVIDER || "mock").toLowerCase(); // empty/unset → dev default
  if (v !== "mock" && v !== "stream")
    throw new Error(`Invalid VIDEO_PROVIDER: "${v}" (expected mock|stream)`);
  return v;
}

export function analyticsProviderName(): AnalyticsProviderName {
  const v = (process.env.ANALYTICS_PROVIDER || "console").toLowerCase(); // empty/unset → dev default
  if (v !== "console" && v !== "posthog")
    throw new Error(
      `Invalid ANALYTICS_PROVIDER: "${v}" (expected console|posthog)`,
    );
  return v;
}

export function emailProviderName(): EmailProviderName {
  const v = (process.env.EMAIL_PROVIDER || "console").toLowerCase(); // empty/unset → dev default
  if (v !== "console" && v !== "resend")
    throw new Error(`Invalid EMAIL_PROVIDER: "${v}" (expected console|resend)`);
  return v;
}

export function aiProviderName(): AiProviderName {
  const v = (process.env.AI_PROVIDER || "mock").toLowerCase(); // empty/unset → dev default
  if (v !== "mock" && v !== "live")
    throw new Error(`Invalid AI_PROVIDER: "${v}" (expected mock|live)`);
  return v;
}

/** True when a development/mock provider is active for any dependency. */
export function usingDevProviders(): boolean {
  return (
    paymentProviderName() === "mock" ||
    otpProviderName() === "test" ||
    videoProviderName() === "mock"
  );
}

// ── Staging mode (test.goskilled.in) ────────────────────────────────────────
// A deliberate, tightly-scoped escape hatch: a PRODUCTION build may boot with mock
// payment/OTP/video ON A NON-PRODUCTION HOST so the full app can be exercised end-to-end without
// real money, real SMS, or real video. It is fail-CLOSED and money-safe by construction:
//   • only when NODE_ENV=production AND APP_ENV=staging AND the host is provably NOT the prod domain;
//   • the canonical prod domain ALWAYS hard-throws with mocks, even if APP_ENV=staging (the one rule
//     that must never bend — you can never simulate money on goskilled.in);
//   • an unset/unparseable NEXT_PUBLIC_APP_URL is treated as prod (no positive non-prod proof → strict).
// No flag (APP_ENV unset) → the guard behaves EXACTLY as before.

/** The canonical production hosts. Simulated providers may NEVER run on these. */
const PROD_HOSTS = new Set(["goskilled.in", "www.goskilled.in"]);

/** Hostname of NEXT_PUBLIC_APP_URL, lowercased; null if unset or unparseable. */
function appHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True only when the app is provably served from the canonical production domain. Fail-closed:
 * an unknown/unparseable host returns `false` here, but staging then still requires a *positive*
 * non-prod host (see isStagingMode) — so "unknown host" ends up strict, never staged.
 */
function isProdHost(): boolean {
  const h = appHost();
  return h !== null && PROD_HOSTS.has(h);
}

/**
 * Staging mode = production build, explicitly flagged `APP_ENV=staging`, on a host that is
 * positively NOT the prod domain (parseable + not in PROD_HOSTS). Money-safe fail-closed:
 * unset/unparseable host or a prod host → NOT staging → the strict guard hard-throws.
 */
export function isStagingMode(): boolean {
  if (process.env.NODE_ENV !== "production") return false; // dev is its own (unchanged) mode
  if ((process.env.APP_ENV || "").toLowerCase() !== "staging") return false;
  const h = appHost();
  return h !== null && !PROD_HOSTS.has(h); // require a proven non-prod host
}

/**
 * Whether the app-wide STAGING banner should render. Gated on APP_ENV=staging AND a non-prod host,
 * so it can never appear on the real production domain (belt-and-suspenders with the boot guard,
 * which already hard-throws on a staging-flagged prod host). Independent of NODE_ENV so a local
 * `APP_ENV=staging` preview also shows it.
 */
export function showStagingBanner(): boolean {
  if ((process.env.APP_ENV || "").toLowerCase() !== "staging") return false;
  return !isProdHost();
}

let warnedStaging = false;

/** Loud, once-per-process boot warning that simulated providers are active in staging. */
function warnStagingProviders(offenders: string[]): void {
  if (warnedStaging) return;
  warnedStaging = true;
  console.warn(
    "\n══════════════════════════════════════════════════════════════════════\n" +
      "  ⚠  STAGING MODE — SIMULATED PROVIDERS ACTIVE (NOT REAL):\n" +
      `        ${offenders.join(", ")}\n` +
      "  Payments, OTP and video are MOCKED — no real money moves, no real SMS.\n" +
      `  Host: ${appHost() ?? "(unknown)"} · APP_ENV=staging. This must NEVER be the prod domain.\n` +
      "══════════════════════════════════════════════════════════════════════\n",
  );
}

/**
 * Fail immediately if production is booting with any mock/test provider.
 * Called at import time (startup) AND inside every provider getter (defence in depth).
 *
 * Staging exception: a non-prod-host deploy flagged APP_ENV=staging WARNS loudly and boots instead
 * of throwing (see isStagingMode). The prod domain still hard-throws — always.
 */
export function assertProductionProviderSafety(): void {
  if (process.env.NODE_ENV !== "production") return;
  const offenders: string[] = [];
  if (paymentProviderName() === "mock") offenders.push("PAYMENT_PROVIDER=mock");
  if (otpProviderName() === "test") offenders.push("OTP_PROVIDER=test");
  if (videoProviderName() === "mock") offenders.push("VIDEO_PROVIDER=mock");
  if (offenders.length === 0) return; // real providers everywhere → nothing to guard

  // Staging escape hatch — only on a proven non-prod host; the prod domain never reaches here.
  if (isStagingMode()) {
    warnStagingProviders(offenders);
    return;
  }

  throw new Error(
    `FATAL: development providers enabled in production (${offenders.join(", ")}). ` +
      `Set PAYMENT_PROVIDER=razorpay, OTP_PROVIDER=live and VIDEO_PROVIDER=stream with real credentials before deploying.`,
  );
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

let warnedEmail = false;

/**
 * Email mirrors the analytics exception (2a): `console` in production is DEGRADED (receipts are
 * logged, not delivered) but NOT unsafe — money still moves correctly. So we WARN instead of
 * throwing, and email is intentionally kept OUT of assertProductionProviderSafety(). Warns once.
 */
export function softWarnProductionEmail(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (emailProviderName() !== "console") return;
  if (warnedEmail) return;
  warnedEmail = true;
  console.warn(
    "[email] WARNING: EMAIL_PROVIDER=console in production — purchase receipts are logged, NOT delivered. " +
      "Set EMAIL_PROVIDER=resend with RESEND_API_KEY to send real emails.",
  );
}

let warnedAi = false;

/**
 * Guru's AI provider mirrors the analytics/email exception (GPS-M5 §2.0). `mock` in production is
 * DEGRADED (Guru returns deterministic canned answers instead of real Hinglish tutoring) but NOT
 * unsafe — no money moves through Guru, D-29 + cost caps hold in both modes, and DR-029 lets the
 * flagship ship on mock until the Anthropic key lands (LC #35). So we WARN instead of throwing, and
 * AI is intentionally kept OUT of assertProductionProviderSafety(). Called by getAiProvider(); warns once.
 */
export function softWarnProductionAi(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (aiProviderName() !== "mock") return;
  if (warnedAi) return;
  warnedAi = true;
  console.warn(
    "[ai] WARNING: AI_PROVIDER=mock in production — Guru returns canned answers, not real tutoring. " +
      "Set AI_PROVIDER=live with ANTHROPIC_API_KEY to enable the flagship (LC #35).",
  );
}

// Startup guard — importing this module anywhere enforces it. (Analytics, email and AI are
// intentionally excluded here; see softWarnProductionAnalytics/softWarnProductionEmail/softWarnProductionAi.)
assertProductionProviderSafety();
