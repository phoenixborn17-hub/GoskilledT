// Unit 3 (§2.5) — LOCK the guardrail's exact prescribed strings. The existing guru-domain test
// asserts `answer === GURU_INCOME_REDIRECT` (both sides move together, so a silent edit passes).
// This locks the LITERAL text + the D-29 invariants so the money-safety copy can't drift unnoticed.
import { describe, it, expect } from "vitest";
import { GURU_INCOME_REDIRECT } from "@/modules/ai/guru/guardrail";

describe("Guru income-redirect string is LOCKED (D-29)", () => {
  it("matches the exact prescribed Hinglish copy", () => {
    expect(GURU_INCOME_REDIRECT).toBe(
      "Main aapka course tutor hoon — paise ya kamai ki baat main nahi kar sakta. " +
        "Chalo is lesson ka koi bhi concept clear karte hain, jo bhi doubt ho pooch lo!",
    );
  });

  it("contains NO number or currency (D-29 floor: never a figure)", () => {
    expect(GURU_INCOME_REDIRECT).not.toMatch(/\d/);
    expect(GURU_INCOME_REDIRECT).not.toMatch(/[₹$]/);
  });

  it("makes no income promise (no earn/income/guarantee/payout words in English)", () => {
    expect(GURU_INCOME_REDIRECT.toLowerCase()).not.toMatch(
      /\b(earn|income|guarantee|guaranteed|payout|commission|salary|profit)\b/,
    );
  });
});
