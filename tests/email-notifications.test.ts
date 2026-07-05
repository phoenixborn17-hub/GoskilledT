// GPS-M5 §2.4 — pure email builder tests (no I/O). Copy is D-29-safe, unsubscribe is always present.
import { describe, it, expect } from "vitest";
import {
  buildWelcomeEmail,
  buildCertificateReadyEmail,
} from "../lib/email/notifications";

const INCOME =
  /\b(earn|earning|income|salary|kamai|kamao|kamaunga)\b|₹|\bpaisa\b|\bpaise\b/i;

describe("buildWelcomeEmail", () => {
  const msg = buildWelcomeEmail({
    to: "asha@example.com",
    name: "Asha",
    appUrl: "https://goskilled.in",
    unsubscribeUrl: "https://goskilled.in/unsubscribe?u=u1",
  });
  it("addresses the learner, links to the dashboard, and has an unsubscribe", () => {
    expect(msg.to).toBe("asha@example.com");
    expect(msg.subject).toMatch(/Welcome/i);
    expect(msg.html).toContain("Asha");
    expect(msg.html).toContain("https://goskilled.in/dashboard");
    expect(msg.html).toContain("/unsubscribe?u=u1");
    expect(msg.idempotencyKey).toBe("welcome:asha@example.com");
  });
  it("is D-29 safe (no income/earnings language)", () => {
    expect(INCOME.test(msg.text ?? "")).toBe(false);
    expect(INCOME.test(msg.html)).toBe(false);
  });
});

describe("buildCertificateReadyEmail", () => {
  const msg = buildCertificateReadyEmail({
    to: "asha@example.com",
    name: "Asha",
    courseTitle: "AI Prompt Mastery",
    serial: "GS-ABCDE-12345",
    appUrl: "https://goskilled.in",
    unsubscribeUrl: "https://goskilled.in/unsubscribe?u=u1",
  });
  it("names the course, links to verify, and dedupes by serial", () => {
    expect(msg.subject).toContain("AI Prompt Mastery");
    expect(msg.html).toContain("AI Prompt Mastery");
    expect(msg.html).toContain("/verify/GS-ABCDE-12345");
    expect(msg.idempotencyKey).toBe("cert-ready:GS-ABCDE-12345");
    expect(msg.html).toContain("/unsubscribe?u=u1");
  });
  it("is D-29 safe (no income/earnings language)", () => {
    expect(INCOME.test(msg.text ?? "")).toBe(false);
    expect(INCOME.test(msg.html)).toBe(false);
  });
});
