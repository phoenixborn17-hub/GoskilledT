// The ONE call site all instrumentation uses (Ticket 8). Analytics must NEVER break a product
// or money path (Golden Rule 2/3): every failure is swallowed and logged, so a PostHog outage
// can't fail a checkout or a webhook. Callers on hot paths fire-and-forget (do not await).
import { getAnalyticsProvider } from "./provider";
import { buildAnalyticsEvent, type AnalyticsEventName, type AnalyticsProperties } from "../../modules/analytics/events";
import { createHash } from "node:crypto";

/**
 * Stable, pseudonymous distinct id from a phone (or any seed). We NEVER send the raw number as a
 * distinct id — this lets us stitch a pre-auth funnel (webinar → checkout) without leaking PII.
 */
export function anonId(seed: string): string {
  return "anon_" + createHash("sha256").update(seed).digest("hex").slice(0, 16);
}

/** Capture one event. Resolves even on failure — analytics is best-effort by contract. */
export async function track(
  name: AnalyticsEventName,
  distinctId: string,
  properties: AnalyticsProperties = {},
): Promise<void> {
  try {
    const event = buildAnalyticsEvent({ name, distinctId, properties, now: new Date() });
    await getAnalyticsProvider().capture(event);
  } catch (e) {
    // Degrade silently for the product; surface to ops via the log.
    console.warn(`[analytics] capture failed for "${name}":`, e instanceof Error ? e.message : e);
  }
}
