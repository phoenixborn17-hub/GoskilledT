// KYC email/WhatsApp verification SEND provider (Phase C §3 · LAUNCH_CONFIG). The actual delivery
// service is a Layer-2 decision — this file gates it. Default `console` is a no-op (dev logs a benign
// line, NEVER the raw code or full target). `live` is intentionally not wired yet: selecting it
// without configuration fails loudly rather than silently pretending to deliver.
import type { VerifyChannel } from "../../modules/kyc/verify";

export type KycVerifyProvider = "console" | "live";

export function kycVerifyProviderName(): KycVerifyProvider {
  const v = (process.env.KYC_VERIFY_PROVIDER || "console").toLowerCase();
  if (v !== "console" && v !== "live")
    throw new Error(
      `Invalid KYC_VERIFY_PROVIDER: "${v}" (expected console|live)`,
    );
  return v;
}

function maskTarget(t: string): string {
  // email → a***@domain ; number → last 4 only. Never log the full value.
  if (t.includes("@")) {
    const [u, d] = t.split("@");
    return `${u.slice(0, 1)}***@${d}`;
  }
  return `••••${t.slice(-4)}`;
}

/** "Send" a verification code. Console provider never transmits (and never logs the code). */
export async function sendVerificationCode(
  channel: VerifyChannel,
  target: string,
  code: string,
): Promise<void> {
  if (!code) throw new Error("Missing verification code");
  const provider = kycVerifyProviderName();
  if (provider === "console") {
    if (process.env.NODE_ENV !== "production")
      console.log(
        `[kyc-verify] ${channel} code issued for ${maskTarget(target)} (console provider — not delivered)`,
      );
    return;
  }
  // live: real email/SMS/WhatsApp service — LAUNCH_CONFIG, not built in Phase C.
  throw new Error(
    "KYC verify provider 'live' is not configured yet (LAUNCH_CONFIG).",
  );
}
