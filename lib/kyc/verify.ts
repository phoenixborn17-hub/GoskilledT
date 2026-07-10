// Contact verification adapter (Phase C §3). Generates a short-lived 6-digit code, stores ONLY its
// hash, "sends" it via the config-gated provider, and — on a correct code — stamps the verify flag
// on the Kyc row (`emailVerifiedAt` / `whatsappVerifiedAt`). The raw code and full target never leave
// the server and are never logged. Pure checks live in modules/kyc/verify.
import { randomInt } from "node:crypto";
import { prisma } from "../prisma";
import {
  hashVerificationCode,
  checkVerification,
  isValidEmail,
  normalizeWhatsapp,
  VERIFY_CODE_TTL_MS,
  VERIFY_CODE_LENGTH,
  type VerifyChannel,
} from "../../modules/kyc/verify";
import { sendVerificationCode } from "./verify-provider";

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Validate + normalize a target for a channel (email → lowercased; whatsapp → +91XXXXXXXXXX). */
function normalizeTarget(channel: VerifyChannel, raw: string): string | null {
  if (channel === "email") {
    const e = raw.trim().toLowerCase();
    return isValidEmail(e) ? e : null;
  }
  return normalizeWhatsapp(raw);
}

/** Issue a code for a channel/target, persist its hash, store the target on Kyc, and send it. */
export async function startContactVerification(
  userId: string,
  channel: VerifyChannel,
  rawTarget: string,
): Promise<VerifyResult> {
  const target = normalizeTarget(channel, rawTarget);
  if (!target)
    return {
      ok: false,
      error:
        channel === "email"
          ? "Enter a valid email."
          : "Enter a valid 10-digit mobile.",
    };

  const code = String(randomInt(0, 10 ** VERIFY_CODE_LENGTH)).padStart(
    VERIFY_CODE_LENGTH,
    "0",
  );
  await prisma.contactVerification.create({
    data: {
      userId,
      channel,
      target,
      codeHash: hashVerificationCode(code),
      expiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS),
    },
  });
  // Persist the (unverified) target on the KYC row so submit/admin see what's pending.
  await prisma.kyc.upsert({
    where: { userId },
    create: {
      userId,
      ...(channel === "email" ? { email: target } : { whatsapp: target }),
    },
    update: channel === "email" ? { email: target } : { whatsapp: target },
  });
  await sendVerificationCode(channel, target, code);
  return { ok: true };
}

/** Confirm a code. On success, stamps the verify flag on Kyc and consumes the code (single-use). */
export async function confirmContactVerification(
  userId: string,
  channel: VerifyChannel,
  rawTarget: string,
  code: string,
): Promise<VerifyResult> {
  const target = normalizeTarget(channel, rawTarget);
  if (!target) return { ok: false, error: "Invalid details." };

  const rec = await prisma.contactVerification.findFirst({
    where: { userId, channel, target, consumedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      codeHash: true,
      target: true,
      expiresAt: true,
      consumedAt: true,
    },
  });
  if (!rec)
    return {
      ok: false,
      error: "No pending verification — request a new code.",
    };

  const verdict = checkVerification(rec, code, target, new Date());
  if (!verdict.ok) return { ok: false, error: verdict.reason };

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.contactVerification.update({
      where: { id: rec.id },
      data: { consumedAt: now },
    });
    await tx.kyc.upsert({
      where: { userId },
      create: {
        userId,
        ...(channel === "email"
          ? { email: target, emailVerifiedAt: now }
          : { whatsapp: target, whatsappVerifiedAt: now }),
      },
      update:
        channel === "email"
          ? { emailVerifiedAt: now }
          : { whatsappVerifiedAt: now },
    });
  });
  return { ok: true };
}
