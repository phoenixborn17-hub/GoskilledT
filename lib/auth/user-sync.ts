// User synchronization (Ticket 3, Task 2). On the first authenticated request we upsert our
// internal User keyed by Supabase id. Guarantees: no duplicate users, unique supabaseId,
// unique phone, referral attribution preserved. Idempotent — safe to call every request.
import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import { generateReferralCode, normalizePhoneE164 } from "./referral";

export interface SyncableUser {
  id: string; // Supabase auth user id
  phone?: string | null;
}

export interface SyncResult {
  id: string;
  supabaseId: string | null;
  phone: string | null;
  referralCode: string;
  referredById: string | null;
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Resolve a referral code to an upline user id, ignoring unknown codes and self-referral. */
async function resolveReferrer(refCode: string | undefined, selfSupabaseId: string): Promise<string | null> {
  if (!refCode) return null;
  const referrer = await prisma.user.findUnique({
    where: { referralCode: refCode.trim().toUpperCase() },
    select: { id: true, supabaseId: true },
  });
  if (!referrer) return null;
  if (referrer.supabaseId === selfSupabaseId) return null; // never self-refer
  return referrer.id;
}

export async function syncUser(supabaseUser: SyncableUser, refCode?: string): Promise<SyncResult> {
  const supabaseId = supabaseUser.id;
  const phone = normalizePhoneE164(supabaseUser.phone);

  // 1) Already synced by Supabase id → return as-is (no duplicate, no attribution overwrite).
  const bySupabase = await prisma.user.findUnique({ where: { supabaseId } });
  if (bySupabase) return bySupabase;

  const referredById = await resolveReferrer(refCode, supabaseId);

  // 2) A row may already exist by phone (created by checkout's resolveBuyer before auth existed).
  //    Link the Supabase id onto it; fill referral only if it had none.
  if (phone) {
    const byPhone = await prisma.user.findUnique({ where: { phone } });
    if (byPhone) {
      return prisma.user.update({
        where: { id: byPhone.id },
        data: {
          supabaseId,
          referredById: byPhone.referredById ?? referredById,
          isVerified: true,
        },
      });
    }
  }

  // 3) Create fresh, retrying only on referralCode collision (astronomically rare).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.user.create({
        data: { supabaseId, phone, referralCode: generateReferralCode(), referredById, isVerified: true },
      });
    } catch (e) {
      // A concurrent request may have created the row by supabaseId/phone first — re-read it.
      if (isUniqueViolation(e)) {
        const raced = await prisma.user.findUnique({ where: { supabaseId } });
        if (raced) return raced;
        if (attempt === 4) throw e; // otherwise assume referralCode collision → retry
      } else {
        throw e;
      }
    }
  }
  throw new Error("Failed to sync user after retries");
}
