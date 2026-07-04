// Dev-only webhook simulator (Ticket 3). Signs a Razorpay-shaped payload with
// RAZORPAY_WEBHOOK_SECRET and POSTs it to the REAL webhook route, so mock-mode payments
// run the exact production pipeline: payment → webhook → order paid → enroll → held
// commission → ledger. There is no alternate dev path.
//
// Usage:
//   tsx scripts/dev-simulate-webhook.ts <razorpayOrderId> <amountInPaise> [capture|refund] [paymentId]
//
// Example (after checkout returns a mock order):
//   tsx scripts/dev-simulate-webhook.ts mock_order_ab12cd34 219900
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildSignedCapture,
  buildSignedRefund,
} from "../lib/payments/dev-webhook";

// Load .env (no dotenv dependency).
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    // Quoted value: take up to the MATCHING closing quote (anything after it — e.g. an
    // inline "# comment" — is ignored, matching Next.js's own .env loader behaviour).
    const quote = v[0] === '"' || v[0] === "'" ? v[0] : null;
    if (quote) {
      const end = v.indexOf(quote, 1);
      v = end === -1 ? v.slice(1) : v.slice(1, end);
    } else {
      // Unquoted value: strip a trailing inline comment (whitespace + '#').
      const hash = v.search(/\s#/);
      if (hash !== -1) v = v.slice(0, hash).trim();
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "dev-simulate-webhook is a development tool and must never run in production.",
  );
}

async function main() {
  const [orderIdArg, amountArg, kind = "capture", paymentIdArg] =
    process.argv.slice(2);
  if (!orderIdArg || !amountArg) {
    console.error(
      "Usage: tsx scripts/dev-simulate-webhook.ts <razorpayOrderId> <amountInPaise> [capture|refund] [paymentId]",
    );
    process.exit(1);
  }
  const amountInPaise = Number(amountArg);
  if (!Number.isInteger(amountInPaise) || amountInPaise <= 0)
    throw new Error("amountInPaise must be a positive integer");

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret)
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not set in .env");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const endpoint = `${appUrl.replace(/\/$/, "")}/api/webhooks/razorpay`;

  const signed =
    kind === "refund"
      ? buildSignedRefund({
          paymentId: paymentIdArg ?? orderIdArg,
          amountInPaise,
          webhookSecret,
        })
      : buildSignedCapture({
          razorpayOrderId: orderIdArg,
          amountInPaise,
          webhookSecret,
          paymentId: paymentIdArg,
        });

  console.log(`→ POST ${endpoint}  (${kind}, event ${signed.eventId})`);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": signed.signature,
      "x-razorpay-event-id": signed.eventId,
    },
    body: signed.body,
  });
  console.log(`← ${res.status} ${await res.text()}`);
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
