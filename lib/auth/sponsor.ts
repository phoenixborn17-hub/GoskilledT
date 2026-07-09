// Referral-code → sponsor resolution (DR-036/DR-038). The referral code is MANDATORY for every new
// registration, so this is the gate that decides whether the register form may proceed. Security:
// a miss returns null with NO signal about which codes exist (no user-enumeration — §6); callers
// surface a single generic "Enter a valid referral code" error for both "empty" and "not found".
import { prisma } from "../prisma";

export interface Sponsor {
  id: string;
  /** First name only, for a warm "Invited by Rahul" — never the sponsor's phone/email (privacy §5). */
  firstName: string | null;
}

/** Normalize a raw code to the referralCode shape (GS + hex, upper-cased). Junk/empty → null. */
export function normalizeReferralCode(
  raw: string | null | undefined,
): string | null {
  const cleaned = (raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return cleaned.length >= 3 && cleaned.length <= 24 ? cleaned : null;
}

/** Resolve a referral code to its sponsor, or null on any miss (empty / malformed / not found). */
export async function resolveSponsorByCode(
  rawCode: string | null | undefined,
): Promise<Sponsor | null> {
  const code = normalizeReferralCode(rawCode);
  if (!code) return null;
  const u = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, name: true },
  });
  if (!u) return null;
  return { id: u.id, firstName: u.name?.trim().split(/\s+/)[0] || null };
}
