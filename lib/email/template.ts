// GPS-M5 §2.4 — shared premium email template. PURE (no I/O). One brand shell for all product emails:
// green wordmark header, warm body, optional CTA, company + one-click unsubscribe footer. Inline
// styles only (email-client safe). D-29: never any income/earnings language. Copy = LC voice slot.
import type { EmailMessage } from "./receipt";

export interface BrandEmailInput {
  to: string;
  subject: string;
  preheader?: string; // hidden inbox-preview line
  heading: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  unsubscribeUrl: string;
  idempotencyKey: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const GREEN = "#137E49";
const CHARCOAL = "#2A302A";
const OFFWHITE = "#F7F7F4";

export function buildBrandEmail(i: BrandEmailInput): EmailMessage {
  const ctaHtml = i.cta
    ? `<tr><td style="padding:8px 0 4px"><a href="${esc(i.cta.href)}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${esc(i.cta.label)}</a></td></tr>`
    : "";

  const bodyHtml = i.paragraphs
    .map(
      (p) =>
        `<tr><td style="padding:6px 0;font-size:15px;line-height:1.65;color:${CHARCOAL}">${esc(p)}</td></tr>`,
    )
    .join("");

  const html = `<div style="background:${OFFWHITE};padding:24px 12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <span style="display:none;opacity:0;color:${OFFWHITE};font-size:1px">${esc(i.preheader ?? i.heading)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7e7e2">
    <tr><td style="padding:20px 28px;border-bottom:1px solid #eee">
      <span style="font-size:18px;font-weight:800;color:${GREEN};letter-spacing:-0.3px">GoSkilled</span>
    </td></tr>
    <tr><td style="padding:24px 28px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:20px;font-weight:800;color:${CHARCOAL};padding-bottom:8px">${esc(i.heading)}</td></tr>
        ${bodyHtml}
        ${ctaHtml}
      </table>
    </td></tr>
    <tr><td style="padding:18px 28px 24px;border-top:1px solid #eee;font-size:12px;line-height:1.6;color:#8a8f88">
      GoSkilled · EDZERA INSPIRING EXCELLENCE LLP · Made in India<br>
      You're receiving this because you have a GoSkilled account.
      <a href="${esc(i.unsubscribeUrl)}" style="color:${GREEN}">Unsubscribe from emails</a>.
    </td></tr>
  </table>
</div>`;

  const text =
    `${i.heading}\n\n` +
    i.paragraphs.join("\n\n") +
    (i.cta ? `\n\n${i.cta.label}: ${i.cta.href}` : "") +
    `\n\n— GoSkilled · EDZERA INSPIRING EXCELLENCE LLP\nUnsubscribe: ${i.unsubscribeUrl}`;

  return {
    to: i.to,
    subject: i.subject,
    text,
    html,
    idempotencyKey: i.idempotencyKey,
  };
}
