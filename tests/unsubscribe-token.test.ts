// GPS-M5 §2.4 (Fable Tier-A condition 3) — unsubscribe token: a valid HMAC opts out; a tampered,
// swapped, or missing sig is rejected (one learner can't opt out another; scanners can't forge).
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  signUnsubscribe,
  verifyUnsubscribe,
  unsubscribeKey,
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

// DR-031 Batch 1 (security) — key resolution: prod must NOT silently derive a key.
describe("unsubscribeKey() resolution", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the dedicated secret when set (any environment)", () => {
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "dedicated-key");
    vi.stubEnv("NODE_ENV", "production");
    expect(unsubscribeKey()).toBe("dedicated-key");
  });

  it("THROWS in production when the dedicated secret is unset (no silent DB fallback)", () => {
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://should-not-be-used");
    expect(() => unsubscribeKey()).toThrow(/required in production/i);
  });

  it("derives from DATABASE_URL in dev when the dedicated secret is unset", () => {
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgres://dev-key-material");
    expect(unsubscribeKey()).toBe("postgres://dev-key-material");
  });
});
