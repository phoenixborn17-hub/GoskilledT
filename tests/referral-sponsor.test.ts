// Phase A (DR-036) — referral-code normalization (pure) + sponsor resolution (integration).
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  normalizeReferralCode,
  resolveSponsorByCode,
} from "@/lib/auth/sponsor";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);

describe("normalizeReferralCode", () => {
  it("upper-cases and strips non-alphanumerics", () => {
    expect(normalizeReferralCode(" gs1a2b ")).toBe("GS1A2B");
    expect(normalizeReferralCode("gs-1a2b3c")).toBe("GS1A2B3C");
  });
  it("rejects empty / too-short / too-long", () => {
    expect(normalizeReferralCode("")).toBeNull();
    expect(normalizeReferralCode("ab")).toBeNull();
    expect(normalizeReferralCode("G".repeat(25))).toBeNull();
    expect(normalizeReferralCode(null)).toBeNull();
  });
});

describe.skipIf(!HAS_DB)("resolveSponsorByCode (integration)", () => {
  it("resolves a real code to its sponsor id + first name; unknown → null (no enumeration)", async () => {
    const code = `GS${runId}A`.toUpperCase();
    const sponsor = await prisma.user.create({
      data: {
        supabaseId: `sb_spon_${runId}`,
        phone: `+9198${runId}01`,
        name: "Rahul Sharma",
        referralCode: code,
      },
      select: { id: true },
    });

    const hit = await resolveSponsorByCode(code.toLowerCase()); // case-insensitive
    expect(hit?.id).toBe(sponsor.id);
    expect(hit?.firstName).toBe("Rahul"); // first name only (privacy §5)

    expect(await resolveSponsorByCode("GSZZZNONE")).toBeNull();
    expect(await resolveSponsorByCode("")).toBeNull();
  });
});
