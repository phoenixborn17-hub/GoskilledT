// Ticket 3, Task 6 — provider selection + production safety guard. Pure, no DB.
import { describe, it, expect, afterEach, vi } from "vitest";
import { paymentProviderName, otpProviderName, assertProductionProviderSafety } from "@/lib/config/providers";
import { getPaymentProvider } from "@/lib/payments/provider";

afterEach(() => vi.unstubAllEnvs());

describe("provider selection", () => {
  it("defaults to mock + test when unset/empty", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "");
    vi.stubEnv("OTP_PROVIDER", "");
    expect(paymentProviderName()).toBe("mock");
    expect(otpProviderName()).toBe("test");
  });

  it("selects razorpay / live when configured", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "razorpay");
    vi.stubEnv("OTP_PROVIDER", "live");
    expect(paymentProviderName()).toBe("razorpay");
    expect(otpProviderName()).toBe("live");
  });

  it("rejects invalid values", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "paypal");
    expect(() => paymentProviderName()).toThrow(/Invalid PAYMENT_PROVIDER/);
    vi.stubEnv("OTP_PROVIDER", "sms");
    expect(() => otpProviderName()).toThrow(/Invalid OTP_PROVIDER/);
  });

  it("mock provider returns realistic mock_order_ ids", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    const provider = getPaymentProvider();
    expect(provider.name).toBe("mock");
    const order = await provider.createOrder({ amountInPaise: 149900, receipt: "r1" });
    expect(order.id).toMatch(/^mock_order_[0-9a-f]{20}$/);
  });
});

describe("production safety guard", () => {
  it("passes in development with mock/test", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("OTP_PROVIDER", "test");
    expect(() => assertProductionProviderSafety()).not.toThrow();
  });

  it("THROWS in production when mock payment is active", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("OTP_PROVIDER", "live");
    expect(() => assertProductionProviderSafety()).toThrow(/development providers enabled in production/);
  });

  it("THROWS in production when test OTP is active", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "razorpay");
    vi.stubEnv("OTP_PROVIDER", "test");
    expect(() => assertProductionProviderSafety()).toThrow(/development providers enabled in production/);
  });

  it("getPaymentProvider() also refuses mock in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("OTP_PROVIDER", "live");
    expect(() => getPaymentProvider()).toThrow(/development providers enabled in production/);
  });

  it("passes in production with razorpay + live", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "razorpay");
    vi.stubEnv("OTP_PROVIDER", "live");
    expect(() => assertProductionProviderSafety()).not.toThrow();
  });
});
