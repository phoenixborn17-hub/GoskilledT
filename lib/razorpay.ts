// Razorpay order creation (server-only). Signature VERIFICATION lives in the pure
// modules/payments/razorpay.ts rule — this file only talks to the Razorpay API.
import Razorpay from "razorpay";
import { requireEnv } from "./env";

export interface CreateRzpOrderInput {
  amountInPaise: number; // Razorpay expects the charge in paise
  receipt: string;
  notes?: Record<string, string>;
}

export interface RzpOrder {
  id: string;
}

/** The injectable dependency shape used by checkout — real impl below, faked in tests. */
export type RzpOrderCreator = (input: CreateRzpOrderInput) => Promise<RzpOrder>;

let client: Razorpay | null = null;
function rzp(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: requireEnv("RAZORPAY_KEY_ID"),
      key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
    });
  }
  return client;
}

export const createRazorpayOrder: RzpOrderCreator = async (input) => {
  const order = await rzp().orders.create({
    amount: input.amountInPaise,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes,
  });
  return { id: order.id };
};
