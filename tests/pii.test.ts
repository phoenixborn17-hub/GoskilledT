import { describe, it, expect } from "vitest";
import { encryptPii, decryptPii, maskLast4 } from "@/lib/pii";

const KEY = Buffer.alloc(32, 5);

describe("pii encryption (AES-256-GCM)", () => {
  it("roundtrips and never leaks the plaintext", () => {
    const ct = encryptPii("ABCDE1234F", KEY);
    expect(ct).not.toContain("ABCDE1234F");
    expect(ct.split(":")).toHaveLength(3); // iv:tag:ciphertext
    expect(decryptPii(ct, KEY)).toBe("ABCDE1234F");
  });

  it("produces different ciphertext each call (random IV)", () => {
    expect(encryptPii("x", KEY)).not.toBe(encryptPii("x", KEY));
  });

  it("fails to decrypt with the wrong key (auth tag)", () => {
    const ct = encryptPii("secret-account-no", KEY);
    expect(() => decryptPii(ct, Buffer.alloc(32, 9))).toThrow();
  });

  it("masks to the last 4 characters only", () => {
    expect(maskLast4("123456789012")).toBe("•••• 9012");
    expect(maskLast4("ABCDE1234F")).toBe("•••• 234F");
    expect(maskLast4("12")).toBe("••");
  });
});
