// Affiliate server actions (GPS-M3, Tier A). Money + PII paths: Zod at the boundary, the client is
// NEVER trusted, all rules come from the domain spine (modules/wallet), PII is encrypted before it
// touches the DB and never logged, and every request is audit-logged.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth/session";
import { encryptPii } from "../../../lib/pii";
import {
  isValidPan,
  isValidIfsc,
  isValidAccountNumber,
} from "../../../modules/kyc/kyc";
import { validateWithdrawal } from "../../../modules/wallet/withdrawal";
import { payoutsEnabled } from "../../../lib/env";
import {
  getWalletSummaryFor,
  hasPendingWithdrawal,
} from "../../../lib/wallet/queries";
import { getKycStatus } from "../../../lib/kyc/queries";
import { track, anonId } from "../../../lib/analytics/track";

export type ActionResult = { ok: true } | { ok: false; error: string };

// ── Referral share — fires the canonical `referral_share` event (no PII, no ₹). ──
export async function recordReferralShare(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  await track("referral_share", user.id, { channel: "share" });
  return { ok: true };
}

// ── KYC submit (§2.4) — PII encrypted at rest, audit-logged, never logged in plaintext. ──
const kycSchema = z.object({
  pan: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine(isValidPan, "Enter a valid PAN (e.g. ABCDE1234F)"),
  accountNumber: z
    .string()
    .trim()
    .refine(isValidAccountNumber, "Enter a valid bank account number"),
  ifsc: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine(isValidIfsc, "Enter a valid IFSC (e.g. SBIN0001234)"),
  holderName: z.string().trim().min(1, "Enter the account holder name").max(80),
});

export async function submitKyc(
  input: z.input<typeof kycSchema>,
): Promise<ActionResult> {
  const parsed = kycSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const d = parsed.data;
  try {
    // Encrypt secret fields before they touch the DB; IFSC is a public branch code (plaintext).
    // Module invariant (GPS-M4 §1): the domain write + its audit row commit in ONE $transaction.
    await prisma.$transaction(async (tx) => {
      await tx.kyc.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          panEnc: encryptPii(d.pan),
          accountNoEnc: encryptPii(d.accountNumber),
          accountHolderEnc: encryptPii(d.holderName), // account-holder name (LC #32)
          ifsc: d.ifsc,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        update: {
          panEnc: encryptPii(d.pan),
          accountNoEnc: encryptPii(d.accountNumber),
          accountHolderEnc: encryptPii(d.holderName),
          ifsc: d.ifsc,
          status: "SUBMITTED", // resubmit after a rejection
          submittedAt: new Date(),
        },
      });
      // Audit — NO PII in the audit row (only that a submission happened).
      await tx.adminAction.create({
        data: {
          actorSupabaseId: user.supabaseId ?? user.id,
          action: "KYC_SUBMITTED",
          entity: "Kyc",
          entityId: user.id,
          meta: { anon: anonId(user.id) },
        },
      });
    });
    revalidatePath("/dashboard/earn/kyc");
    revalidatePath("/dashboard/earn/wallet");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not submit KYC. Please try again." };
  }
}

// ── Withdrawal request (§2.5) — every rule from validateWithdrawal (domain), server-enforced. ──
const withdrawalSchema = z.object({
  amountInPaise: z.number().int().positive(),
});

export async function requestWithdrawal(
  input: z.input<typeof withdrawalSchema>,
): Promise<ActionResult> {
  const parsed = withdrawalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid amount." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  // Load state, then delegate the decision entirely to the domain rule.
  const [summary, pending, kycStatus] = await Promise.all([
    getWalletSummaryFor(user.id),
    hasPendingWithdrawal(user.id),
    getKycStatus(user.id),
  ]);

  const check = validateWithdrawal({
    payoutsEnabled: payoutsEnabled(),
    kycStatus: kycStatus ?? "DRAFT",
    hasPendingWithdrawal: pending,
    availableInPaise: summary.availableInPaise,
    amountInPaise: parsed.data.amountInPaise,
  });
  if (!check.ok) return { ok: false, error: check.message };

  try {
    // Module invariant (GPS-M4 §1): withdrawal row + its audit row commit atomically.
    await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amountInPaise: parsed.data.amountInPaise,
          status: "APPLIED",
        },
        select: { id: true },
      });
      await tx.adminAction.create({
        data: {
          actorSupabaseId: user.supabaseId ?? user.id,
          action: "WITHDRAWAL_REQUESTED",
          entity: "Withdrawal",
          entityId: withdrawal.id,
          meta: { amountInPaise: parsed.data.amountInPaise },
        },
      });
    });
    revalidatePath("/dashboard/earn/wallet");
    return { ok: true };
  } catch {
    // Partial unique index (single-pending) is the last-line guard against a race.
    return {
      ok: false,
      error: "Could not request withdrawal. You may already have one pending.",
    };
  }
}
