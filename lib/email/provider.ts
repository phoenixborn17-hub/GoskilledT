// Email provider adapter (2a). console and resend expose the SAME interface — switching = flip
// EMAIL_PROVIDER + add RESEND_API_KEY. Same pattern as analytics: NOT part of the hard production
// guard (console-in-prod only soft-warns). Resend is called over HTTP (no new dependency), lazily,
// so console mode and the test suite never touch the network.
import {
  emailProviderName,
  softWarnProductionEmail,
  type EmailProviderName,
} from "../config/providers";
import { requireEnv } from "../env";
import type { EmailMessage } from "./receipt";

export interface EmailProvider {
  readonly name: EmailProviderName;
  send(msg: EmailMessage): Promise<void>;
}

// ── console: one structured line per email — dev-readable, prod-ALLOWED (degraded, soft-warned). ──
export const consoleEmailProvider: EmailProvider = {
  name: "console",
  async send(msg) {
    console.log(
      JSON.stringify({
        email: "receipt",
        to: msg.to,
        subject: msg.subject,
        idempotencyKey: msg.idempotencyKey,
      }),
    );
  },
};

// ── resend: HTTP API, server-side only. Idempotency-Key header → provider-level at-most-once. ──
export const resendEmailProvider: EmailProvider = {
  name: "resend",
  async send(msg) {
    const key = requireEnv("RESEND_API_KEY");
    const from = process.env.EMAIL_FROM || "GoSkilled <noreply@goskilled.in>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": msg.idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `resend send failed: ${res.status} ${body.slice(0, 200)}`,
      );
    }
  },
};

/** Select the active email provider. Soft-warns (never throws) on console-in-production. */
export function getEmailProvider(): EmailProvider {
  softWarnProductionEmail();
  return emailProviderName() === "resend"
    ? resendEmailProvider
    : consoleEmailProvider;
}
