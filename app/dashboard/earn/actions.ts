// Affiliate server actions (GPS-M3, Tier A). Money + PII paths: Zod at the boundary, the client is
// NEVER trusted, all rules come from the domain spine (modules/wallet), PII is encrypted before it
// touches the DB and never logged, and every request is audit-logged.
"use server";
import { randomBytes } from "node:crypto";
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
import { isKycDocType } from "../../../lib/kyc/doc-types";
import {
  KYC_DOC_KINDS,
  KYC_DOC_COLUMN,
  isAllowedDocContentType,
  uploadKycDoc,
} from "../../../lib/storage/kyc-docs";
import {
  startContactVerification,
  confirmContactVerification,
} from "../../../lib/kyc/verify";
import type { VerifyChannel } from "../../../modules/kyc/verify";
import { checkOtpSendRate } from "../../../lib/auth/otp-rate-limit";
import { checkActionRate } from "../../../lib/auth/action-rate-limit";
import { validateWithdrawal } from "../../../modules/wallet/withdrawal";
import { payoutsEnabled } from "../../../lib/env";
import {
  getWalletSummaryFor,
  hasPendingWithdrawal,
} from "../../../lib/wallet/queries";
import { getKycStatus } from "../../../lib/kyc/queries";
import { track, anonId } from "../../../lib/analytics/track";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB per document
function fileExt(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : "bin";
}

// ── Referral share — fires the canonical `referral_share` event (no PII, no ₹). ──
export async function recordReferralShare(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  await track("referral_share", user.id, { channel: "share" });
  return { ok: true };
}

// ── KYC contact verification (§3) — set the email / WhatsApp verify flag only on a correct code. ──
export async function sendKycVerification(
  channel: VerifyChannel,
  target: string,
): Promise<ActionResult> {
  if (channel !== "email" && channel !== "whatsapp")
    return { ok: false, error: "Invalid channel." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  // Reuse the OTP send throttle (per-phone key stands in for per-user here).
  const rl = await checkOtpSendRate(`${channel}:${user.id}`.slice(-10));
  if (!rl.ok) return { ok: false, error: rl.error };
  try {
    return await startContactVerification(user.id, channel, target);
  } catch {
    return { ok: false, error: "Could not send the code. Please try again." };
  }
}

export async function confirmKycVerification(
  channel: VerifyChannel,
  target: string,
  code: string,
): Promise<ActionResult> {
  if (channel !== "email" && channel !== "whatsapp")
    return { ok: false, error: "Invalid channel." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const res = await confirmContactVerification(user.id, channel, target, code);
  if (res.ok) revalidatePath("/dashboard/earn/kyc");
  return res;
}

// ── KYC submit (§3) — PII + doc paths encrypted at rest, audit-logged, never logged in plaintext. ──
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
  bankName: z.string().trim().min(1, "Enter the bank name").max(80),
  docType: z
    .string()
    .trim()
    .refine(isKycDocType, "Choose a valid document type"),
});

// FormData boundary: KYC now carries file uploads, so the action takes FormData (not a typed object).
export async function submitKyc(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  // Abuse throttle (Unit 3) — PII write path; caps rapid resubmits. No KYC rule changes.
  const rl = await checkActionRate("kyc-submit", user.id, 8);
  if (!rl.ok) return { ok: false, error: rl.error };

  const parsed = kycSchema.safeParse({
    pan: String(formData.get("pan") ?? ""),
    accountNumber: String(formData.get("accountNumber") ?? ""),
    ifsc: String(formData.get("ifsc") ?? ""),
    holderName: String(formData.get("holderName") ?? ""),
    bankName: String(formData.get("bankName") ?? ""),
    docType: String(formData.get("docType") ?? ""),
  });
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  const d = parsed.data;

  // Upload any provided documents to the PRIVATE bucket FIRST (outside the tx). Store only the
  // AES-256-GCM-encrypted object path. A failed upload aborts before any DB write.
  const docEnc: Record<string, string> = {};
  try {
    for (const kind of KYC_DOC_KINDS) {
      const file = formData.get(`${kind}Doc`);
      if (!(file instanceof File) || file.size === 0) continue;
      if (file.size > MAX_DOC_BYTES)
        return { ok: false, error: "Each document must be under 5 MB." };
      if (!isAllowedDocContentType(file.type))
        return {
          ok: false,
          error: "Documents must be a PDF or image (JPG/PNG/WebP).",
        };
      const path = await uploadKycDoc({
        userId: user.id,
        kind,
        bytes: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type,
        ext: fileExt(file.name),
        rand: randomBytes(8).toString("hex"),
      });
      docEnc[KYC_DOC_COLUMN[kind]] = encryptPii(path);
    }
  } catch {
    return {
      ok: false,
      error: "Could not upload a document. Please try again.",
    };
  }

  try {
    // Encrypt secret fields before they touch the DB; IFSC + bank name are not secret (plaintext).
    // Module invariant: the domain write + its audit row commit in ONE $transaction.
    const secret = {
      panEnc: encryptPii(d.pan),
      accountNoEnc: encryptPii(d.accountNumber),
      accountHolderEnc: encryptPii(d.holderName),
      ifsc: d.ifsc,
      bankName: d.bankName,
      docType: d.docType,
      ...docEnc,
    };
    await prisma.$transaction(async (tx) => {
      await tx.kyc.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...secret,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        update: { ...secret, status: "SUBMITTED", submittedAt: new Date() }, // resubmit after rejection
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

  // Abuse throttle (Unit 3) — does NOT change any withdrawal rule; single-pending + validateWithdrawal
  // still own the decision. Dampens rapid-fire submits before we touch the DB.
  const rl = await checkActionRate("withdraw-request", user.id, 6);
  if (!rl.ok) return { ok: false, error: rl.error };

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
