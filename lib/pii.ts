// PII encryption at rest (Golden Rule 6 · GPS-M3 §2.4). AES-256-GCM with PII_ENCRYPTION_KEY
// (LAUNCH_CONFIG #28 — 32-byte base64). Ciphertext format: "iv:authTag:ciphertext" (all base64).
// PAN/bank details are encrypted here and NEVER logged, put in analytics, or shown un-masked.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { requireEnv } from "./env";

function encryptionKey(): Buffer {
  const key = Buffer.from(requireEnv("PII_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32)
    throw new Error("PII_ENCRYPTION_KEY must decode to 32 bytes (AES-256)");
  return key;
}

/** Encrypt a UTF-8 string. `key` is injectable for tests; defaults to the env key. */
export function encryptPii(
  plaintext: string,
  key: Buffer = encryptionKey(),
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

/** Decrypt an "iv:tag:ct" payload. Throws if the auth tag fails (tamper / wrong key). */
export function decryptPii(
  payload: string,
  key: Buffer = encryptionKey(),
): string {
  const [ivB64, tagB64, ctB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Malformed PII ciphertext");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Show only the last 4 characters (account no / PAN) — the ONLY form allowed in the UI. */
export function maskLast4(value: string): string {
  const s = value.replace(/\s+/g, "");
  if (s.length <= 4) return "•".repeat(s.length);
  return `•••• ${s.slice(-4)}`;
}
