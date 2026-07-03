// POST /api/checkout — thin HTTP adapter. Validates with the domain Zod schema, then
// delegates to startCheckout(). No business decisions here.
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkoutStartSchema } from "../../../modules/payments/schemas";
import { startCheckout } from "../../../lib/payments/checkout";
import { getPaymentProvider } from "../../../lib/payments/provider";
import { requireEnv } from "../../../lib/env";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // Route through the provider adapter (Ticket 3 deferred finding) so mock mode works here too.
    const provider = getPaymentProvider();
    const result = await startCheckout(parsed.data, (i) =>
      provider.createOrder(i),
    );
    const keyId =
      provider.name === "razorpay" ? requireEnv("RAZORPAY_KEY_ID") : null;
    return NextResponse.json(
      { ...result, provider: provider.name, keyId },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof ZodError)
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
