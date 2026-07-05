// GPS-M5 §2.4 (Fable Tier-A condition 3) — unsubscribe token: a valid HMAC opts out; a tampered,
// swapped, or missing sig is rejected (one learner can't opt out another; scanners can't forge).
import { describe, it, expect } from "vitest";
import {
  signUnsubscribe,
  verifyUnsubscribe,
} from "@/lib/email/unsubscribe-token";

const SECRET = "test-secret-key-material";

describe("unsubscribe token (HMAC)", () => {
  it("a correctly signed link verifies", () => {
    const sig = signUnsubscribe("user_abc", SECRET);
    expect(verifyUnsubscribe("user_abc", sig, SECRET)).toBe(true);
  });

  it("a tampered signature is rejected", () => {
    const sig = signUnsubscribe("user_abc", SECRET);
    const tampered = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    expect(tampered).not.toBe(sig);
    expect(verifyUnsubscribe("user_abc", tampered, SECRET)).toBe(false);
  });

  it("a signature for a DIFFERENT user cannot opt this user out", () => {
    const sigForOther = signUnsubscribe("user_victim", SECRET);
    // Attacker knows the victim's userId but presents their own (or any) sig.
    expect(verifyUnsubscribe("user_attacker", sigForOther, SECRET)).toBe(false);
  });

  it("a missing/empty signature is rejected", () => {
    expect(verifyUnsubscribe("user_abc", "", SECRET)).toBe(false);
  });

  it("a signature made with a different secret is rejected", () => {
    const sig = signUnsubscribe("user_abc", "other-secret");
    expect(verifyUnsubscribe("user_abc", sig, SECRET)).toBe(false);
  });

  it("verification with no server secret fails closed", () => {
    const sig = signUnsubscribe("user_abc", SECRET);
    expect(verifyUnsubscribe("user_abc", sig, "")).toBe(false);
  });
});
