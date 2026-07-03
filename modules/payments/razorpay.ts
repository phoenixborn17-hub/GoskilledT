// Razorpay signature verification — the ONLY gate that credits money (Golden Rule 2).
// Pure node:crypto; timing-safe comparison. No SDK needed for verification.
import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(expectedHex: string, actualHex: string): boolean {
  const a = Buffer.from(expectedHex, "hex");
  const b = Buffer.from(actualHex, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout callback: signature = HMAC_SHA256(orderId + "|" + paymentId, key_secret). */
export function verifyPaymentSignature(
  p: { razorpayOrderId: string; razorpayPaymentId: string; signature: string },
  keySecret: string,
): boolean {
  const expected = createHmac("sha256", keySecret)
    .update(`${p.razorpayOrderId}|${p.razorpayPaymentId}`)
    .digest("hex");
  try {
    return safeEqualHex(expected, p.signature);
  } catch {
    return false;
  }
}

/** Webhook: signature = HMAC_SHA256(rawBody, webhook_secret). Verify BEFORE parsing JSON. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return safeEqualHex(expected, signature);
  } catch {
    return false;
  }
}
