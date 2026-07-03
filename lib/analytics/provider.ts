// Analytics provider adapter (Ticket 8). console and posthog expose the SAME interface, so
// switching = flip ANALYTICS_PROVIDER + add POSTHOG_API_KEY. Same pattern as payments/OTP/video,
// with ONE deliberate difference: analytics is NOT part of the hard production guard —
// console-in-prod only soft-warns (softWarnProductionAnalytics). posthog-node is loaded LAZILY
// so console mode (and the whole test suite) never touches it. NO client-side SDK this ticket.
import {
  analyticsProviderName,
  softWarnProductionAnalytics,
  type AnalyticsProviderName,
} from "../config/providers";
import { requireEnv } from "../env";
import type { AnalyticsEvent } from "../../modules/analytics/events";

export interface AnalyticsProvider {
  readonly name: AnalyticsProviderName;
  capture(event: AnalyticsEvent): Promise<void>;
  /** Flush any buffered events (posthog batches; console is a no-op). */
  flush(): Promise<void>;
}

// ── console: one structured JSON line per event — dev-readable, grep-able, prod-ALLOWED. ──
export const consoleAnalyticsProvider: AnalyticsProvider = {
  name: "console",
  async capture(event) {
    // Single line so log processors can parse it; properties are already PII-stripped upstream.
    console.log(
      JSON.stringify({
        analytics: event.name,
        distinctId: event.distinctId,
        ts: event.timestamp,
        ...event.properties,
      }),
    );
  },
  async flush() {},
};

// ── posthog: posthog-node, server-side only. Lazy singleton so console mode never imports it. ──
let client: import("posthog-node").PostHog | null = null;

async function posthogClient(): Promise<import("posthog-node").PostHog> {
  if (client) return client;
  const { PostHog } = await import("posthog-node");
  client = new PostHog(requireEnv("POSTHOG_API_KEY"), {
    host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    flushAt: 1, // low-volume server-truth events — send promptly, don't sit in a buffer
    flushInterval: 0,
  });
  return client;
}

export const posthogAnalyticsProvider: AnalyticsProvider = {
  name: "posthog",
  async capture(event) {
    const ph = await posthogClient();
    ph.capture({
      distinctId: event.distinctId,
      event: event.name,
      properties: { ...event.properties, $timestamp: event.timestamp },
    });
  },
  async flush() {
    if (client) await client.flush();
  },
};

/** Select the active analytics provider. Soft-warns (never throws) on console-in-production. */
export function getAnalyticsProvider(): AnalyticsProvider {
  softWarnProductionAnalytics();
  return analyticsProviderName() === "posthog"
    ? posthogAnalyticsProvider
    : consoleAnalyticsProvider;
}
