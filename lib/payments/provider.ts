// Payment provider adapter (Ticket 3). Mock and Razorpay implement the SAME interface,
// so switching = flipping PAYMENT_PROVIDER + adding credentials. No business logic changes.
import { randomBytes } from "node:crypto";
import { assertProductionProviderSafety, paymentProviderName, type PaymentProviderName } from "../config/providers";
import { createRazorpayOrder } from "../razorpay";

export interface CreateOrderInput {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  /** Create a provider order. Returns the provider order id (razorpay: order_xxx, mock: mock_order_xxx). */
  createOrder(input: CreateOrderInput): Promise<{ id: string }>;
}

// ── Mock: realistic ids, same shape as Razorpay, no network/credentials. ──
export const mockPaymentProvider: PaymentProvider = {
  name: "mock",
  async createOrder() {
    return { id: `mock_order_${randomBytes(10).toString("hex")}` };
  },
};

// ── Razorpay: delegates to the existing Ticket 2 adapter (unchanged). ──
export const razorpayPaymentProvider: PaymentProvider = {
  name: "razorpay",
  createOrder: (input) => createRazorpayOrder(input),
};

export function getPaymentProvider(): PaymentProvider {
  assertProductionProviderSafety();
  return paymentProviderName() === "razorpay" ? razorpayPaymentProvider : mockPaymentProvider;
}
