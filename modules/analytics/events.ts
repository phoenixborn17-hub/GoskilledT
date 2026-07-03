// Canonical analytics taxonomy (Ticket 8, Task 1). PURE — no env, no I/O, no framework. The
// single source of truth for WHAT we measure; adapters (console/posthog) decide WHERE it goes.
// Blueprint §Analytics: ~15 canonical events answering ONE launch question —
//   where does the funnel leak?  home → packages → checkout → OTP → paid → lesson 1.

/** Every event name the product may emit. Keep this list small and stable. */
export const ANALYTICS_EVENTS = [
  // top-of-funnel page views (taxonomy-only this ticket — need the client SDK, see below)
  "view_home",
  "view_packages",
  "view_course",
  // checkout funnel (server-truth)
  "begin_checkout", // OTP requested inside checkout
  "checkout_otp_sent", // OTP dispatch succeeded
  "checkout_verified", // OTP verified → Order + payment order created
  "purchase", // Razorpay-verified webhook credited the sale (money truth)
  "payment_failed",
  "refund_processed",
  // learning
  "lesson_complete",
  // lead-gen entry points
  "webinar_registered",
  "waitlist_joined",
  "contact_submitted",
  "user_onboarded",
  "referral_share",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/**
 * The conversion funnel, in order, for leak analysis. `view_home`/`view_packages` are top-of-
 * funnel PAGE views: capturing them reliably needs a client-side SDK (anonymous id + de-bot),
 * which is explicitly OUT of scope this ticket (server has no stable pre-checkout distinct id).
 * They stay in the taxonomy so the funnel is fully specified; emission is a later phase.
 */
export const FUNNEL_STEPS: readonly AnalyticsEventName[] = [
  "view_home",
  "view_packages",
  "begin_checkout",
  "checkout_verified",
  "purchase",
  "lesson_complete",
] as const;

/** Position of an event in the funnel, or -1 if it isn't a funnel step. */
export function funnelStepIndex(name: AnalyticsEventName): number {
  return FUNNEL_STEPS.indexOf(name);
}

// Property values are simple scalars — anything richer belongs in a dedicated event, not a blob.
export type AnalyticsPropertyValue = string | number | boolean | null;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  distinctId: string; // user id, or a hashed pseudonymous id — NEVER raw PII
  properties: AnalyticsProperties;
  timestamp: string; // ISO-8601
}

// Golden Rule 6: PII (and secret-looking values) must never reach a log or external sink.
// Defence-in-depth — even if a caller passes a bad key, we drop it here in the PURE core.
const PII_KEY_FRAGMENTS = ["phone", "email", "pan", "bank", "account", "ifsc", "name", "address", "otp", "token", "secret", "password"];

/** Pure: strip any property whose key looks like PII/a secret. */
export function stripPii(properties: AnalyticsProperties): AnalyticsProperties {
  const out: AnalyticsProperties = {};
  for (const [k, v] of Object.entries(properties)) {
    if (PII_KEY_FRAGMENTS.some((bad) => k.toLowerCase().includes(bad))) continue;
    out[k] = v;
  }
  return out;
}

export interface BuildEventInput {
  name: AnalyticsEventName;
  distinctId: string;
  properties?: AnalyticsProperties;
  now: Date; // injected for purity/determinism
}

/** Pure: build the canonical event envelope (PII stripped, distinctId defaulted). */
export function buildAnalyticsEvent(input: BuildEventInput): AnalyticsEvent {
  return {
    name: input.name,
    distinctId: input.distinctId || "anonymous",
    properties: stripPii(input.properties ?? {}),
    timestamp: input.now.toISOString(),
  };
}
