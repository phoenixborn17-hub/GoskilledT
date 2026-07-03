import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildReceiptEmail } from "@/lib/email/receipt";
import { getEmailProvider, consoleEmailProvider } from "@/lib/email/provider";
import { sendEmail, sendPurchaseReceipt } from "@/lib/email/send";

// Mock the Prisma singleton so sendPurchaseReceipt's user lookup is deterministic (no DB).
const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: () => findUnique() } },
}));

const BASE = {
  orderId: "order_abc",
  toEmail: "buyer@example.com",
  buyerName: "Asha",
  packageName: "Career Booster",
  amountInPaise: 219900,
  paidAt: new Date("2026-07-03T12:00:00Z"),
};

describe("buildReceiptEmail (pure)", () => {
  it("builds a receipt with subject, recipient and idempotency key", () => {
    const m = buildReceiptEmail(BASE);
    expect(m.to).toBe("buyer@example.com");
    expect(m.subject).toContain("Career Booster");
    expect(m.idempotencyKey).toBe("receipt:order_abc");
  });

  it("includes package, formatted amount, order id and the 48-hour refund note", () => {
    const m = buildReceiptEmail(BASE);
    expect(m.text).toContain("Career Booster");
    expect(m.text).toContain("2,199"); // ₹2,199.00 formatted (en-IN)
    expect(m.text).toContain("order_abc");
    expect(m.text).toContain("48 hours");
    expect(m.html).toContain("Career Booster");
  });

  it("greets by name when present, generically otherwise", () => {
    expect(buildReceiptEmail(BASE).text.startsWith("Hi Asha,")).toBe(true);
    expect(
      buildReceiptEmail({ ...BASE, buyerName: null }).text.startsWith("Hi,"),
    ).toBe(true);
  });
});

describe("email provider selection", () => {
  const prev = process.env.EMAIL_PROVIDER;
  afterEach(() => {
    process.env.EMAIL_PROVIDER = prev;
  });

  it("defaults to the console provider", () => {
    delete process.env.EMAIL_PROVIDER;
    expect(getEmailProvider().name).toBe("console");
  });

  it("console provider logs a structured line", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await consoleEmailProvider.send(buildReceiptEmail(BASE));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("receipt"));
    log.mockRestore();
  });
});

describe("sendEmail is fail-safe", () => {
  const prev = process.env.EMAIL_PROVIDER;
  afterEach(() => {
    process.env.EMAIL_PROVIDER = prev;
  });

  it("swallows provider errors (resend without a key) and never throws", async () => {
    process.env.EMAIL_PROVIDER = "resend"; // resend.send → requireEnv('RESEND_API_KEY') throws
    delete process.env.RESEND_API_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(sendEmail(buildReceiptEmail(BASE))).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("sendPurchaseReceipt", () => {
  beforeEach(() => {
    findUnique.mockReset();
    process.env.EMAIL_PROVIDER = "console";
  });

  const order = {
    id: "order_abc",
    userId: "u1",
    packageName: "Career Booster",
    amountInPaise: 219900,
    paidAt: new Date(),
  };

  it("sends when the buyer has an email", async () => {
    findUnique.mockResolvedValue({ email: "buyer@example.com", name: "Asha" });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendPurchaseReceipt(order);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("buyer@example.com"),
    );
    log.mockRestore();
  });

  it("skips and logs when the buyer has no email (best-effort, never throws)", async () => {
    findUnique.mockResolvedValue({ email: null, name: null });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(sendPurchaseReceipt(order)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no email"));
    warn.mockRestore();
  });
});
