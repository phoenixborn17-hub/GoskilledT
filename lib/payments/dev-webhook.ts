// Dev webhook signer (Ticket 3). Builds a Razorpay-shaped, correctly-signed webhook body
// so mock-mode payments flow through the EXACT production pipeline (real webhook route →
// order paid → enroll → HELD commission → ledger). No alternate dev path exists.
// The HMAC scheme is identical to the integration tests and to real Razorpay.
import { createHmac, randomBytes } from "node:crypto";

export interface SignedWebhook {
  body: string;
  signature: string; // HMAC_SHA256(rawBody, webhookSecret) — the x-razorpay-signature header
  eventId: string; // x-razorpay-event-id header
  paymentId: string;
}

function sign(body: string, webhookSecret: string): string {
  return createHmac("sha256", webhookSecret).update(body).digest("hex");
}

/** payment.captured for a mock/real order — drives MARK_PAID → ENROLL → CREDIT_COMMISSIONS. */
export function buildSignedCapture(opts: {
  razorpayOrderId: string;
  amountInPaise: number;
  webhookSecret: string;
  paymentId?: string;
  eventId?: string;
}): SignedWebhook {
  const paymentId = opts.paymentId ?? `mock_pay_${randomBytes(10).toString("hex")}`;
  const body = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: paymentId, order_id: opts.razorpayOrderId, amount: opts.amountInPaise, status: "captured" } } },
  });
  return { body, signature: sign(body, opts.webhookSecret), eventId: opts.eventId ?? `mock_evt_${paymentId}`, paymentId };
}

/** refund.processed for a paid order — drives the within-window clawback path. */
export function buildSignedRefund(opts: {
  paymentId: string;
  amountInPaise: number;
  webhookSecret: string;
  refundId?: string;
  eventId?: string;
}): SignedWebhook {
  const refundId = opts.refundId ?? `mock_rfnd_${randomBytes(10).toString("hex")}`;
  const body = JSON.stringify({
    event: "refund.processed",
    payload: { refund: { entity: { id: refundId, payment_id: opts.paymentId, amount: opts.amountInPaise } } },
  });
  return { body, signature: sign(body, opts.webhookSecret), eventId: opts.eventId ?? `mock_evt_${refundId}`, paymentId: opts.paymentId };
}
