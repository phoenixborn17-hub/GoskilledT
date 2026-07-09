// Contact verification (Phase C §3) — pure domain. Email / WhatsApp are verified with a short-lived
// 6-digit code; only a SHA-256 hash of the code is ever stored. The SEND provider is LAUNCH_CONFIG
// (Layer-2). No raw code and no PII is logged. These functions are framework/DB-free + unit-testable.
import { createHash } from "node:crypto";

export type VerifyChannel = "email" | "whatsapp";
export const VERIFY_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const VERIFY_CODE_LENGTH = 6;

/** SHA-256 hex of the (trimmed) code — what we persist. Never store the raw code. */
export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(v: string): boolean {
  return EMAIL_REGEX.test(v.trim());
}

/** Normalize an Indian WhatsApp number to +91XXXXXXXXXX, or null if it isn't 10 digits. */
export function normalizeWhatsapp(v: string): string | null {
  const digits = (v ?? "").replace(/\D/g, "");
  const ten = digits.slice(-10);
  return ten.length === 10 ? `+91${ten}` : null;
}

export interface StoredVerification {
  codeHash: string;
  target: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

export type VerifyCheck = { ok: true } | { ok: false; reason: string };

/**
 * Pure decision for confirming a code against the stored record. Constant-ish: checks consumed →
 * expiry → hash match. `target` must match the value the code was issued for.
 */
export function checkVerification(
  rec: StoredVerification,
  submittedCode: string,
  submittedTarget: string,
  now: Date,
): VerifyCheck {
  if (rec.consumedAt)
    return { ok: false, reason: "This code has already been used." };
  if (rec.expiresAt <= now)
    return { ok: false, reason: "This code has expired." };
  if (rec.target !== submittedTarget)
    return { ok: false, reason: "This code was issued for a different value." };
  if (hashVerificationCode(submittedCode) !== rec.codeHash)
    return { ok: false, reason: "Incorrect code." };
  return { ok: true };
}
