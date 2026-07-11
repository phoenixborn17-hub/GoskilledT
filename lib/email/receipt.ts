// Purchase-receipt email builder (2a). PURE — no I/O, no env — so it's fully unit-testable.
// D-29: a receipt states facts (what was bought, price, refund window). No income claims.
// COMPLIANCE: the LLP is NOT GST-registered — no "GST" wording anywhere in this receipt
// until registration is confirmed (founder lock, see app/packages/page.tsx).
import { formatINR } from "../money";

export interface ReceiptInput {
  orderId: string;
  toEmail: string;
  buyerName: string | null;
  packageName: string;
  amountInPaise: number;
  paidAt: Date;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Provider-level dedup key — "receipt:{orderId}" → at-most-once per order. */
  idempotencyKey: string;
}

/** Escape HTML special chars — buyerName is user-supplied (onboarding), so the HTML body must
 *  never interpolate it raw (content-injection/phishing vector in email clients). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function buildReceiptEmail(i: ReceiptInput): EmailMessage {
  const amount = formatINR(i.amountInPaise);
  const greeting = i.buyerName ? `Hi ${i.buyerName},` : "Hi,";
  const when = formatDate(i.paidAt);

  const text = [
    greeting,
    "",
    `Thank you for your purchase on GoSkilled. Here is your receipt:`,
    "",
    `Package: ${i.packageName}`,
    `Amount paid: ${amount} — no hidden charges`,
    `Order ID: ${i.orderId}`,
    `Date: ${when} IST`,
    "",
    `Your access unlocks within about 60 seconds. If you need a refund, you have 48 hours from purchase — just reply or contact us.`,
    "",
    `— Team GoSkilled`,
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;color:#2A302A;line-height:1.6">
  <p>${escapeHtml(greeting)}</p>
  <p>Thank you for your purchase on GoSkilled. Here is your receipt:</p>
  <table style="border-collapse:collapse">
    <tr><td style="padding:2px 12px 2px 0"><strong>Package</strong></td><td>${escapeHtml(i.packageName)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0"><strong>Amount paid</strong></td><td>${amount} — no hidden charges</td></tr>
    <tr><td style="padding:2px 12px 2px 0"><strong>Order ID</strong></td><td>${escapeHtml(i.orderId)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0"><strong>Date</strong></td><td>${when} IST</td></tr>
  </table>
  <p>Your access unlocks within about 60 seconds. If you need a refund, you have 48 hours from purchase — just reply or contact us.</p>
  <p>— Team GoSkilled</p>
</div>`;

  return {
    to: i.toEmail,
    subject: `Your GoSkilled receipt — ${i.packageName}`,
    text,
    html,
    idempotencyKey: `receipt:${i.orderId}`,
  };
}
