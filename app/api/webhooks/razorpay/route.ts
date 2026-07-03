// POST /api/webhooks/razorpay — thin HTTP adapter. Reads the RAW body (signature is over
// the raw bytes), then hands off to handleRazorpayWebhook(). No business decisions here.
import { NextResponse } from "next/server";
import { handleRazorpayWebhook } from "../../../../lib/payments/webhook";

// Razorpay signs the exact bytes we must read raw — never let a body parser touch it.
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const eventId = req.headers.get("x-razorpay-event-id");

  const result = await handleRazorpayWebhook(rawBody, signature, eventId);
  return NextResponse.json({ ok: result.status === 200, note: result.note }, { status: result.status });
}
