// Referral code generation. Kept separate from checkout's copy so Ticket 2 stays untouched;
// consolidation is a listed refactor candidate (do not modify existing adapters now).
import { randomBytes } from "node:crypto";

export function generateReferralCode(): string {
  return "GS" + randomBytes(4).toString("hex").toUpperCase(); // GS + 8 hex chars
}

/** Normalize any Supabase/user phone to canonical +91XXXXXXXXXX (India), or null. */
export function normalizePhoneE164(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `+91${digits.slice(-10)}`;
}
