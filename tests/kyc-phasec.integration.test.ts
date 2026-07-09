// Phase C §6 (integration, live DB) — KYC encryption at rest + contact-verify flags + doc-path
// decryption + KYC gating withdrawal. PII is stored as ciphertext and only ever surfaced masked.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { encryptPii } from "@/lib/pii";
import { getKycView, getKycStatus } from "@/lib/kyc/queries";
import { resolveKycDocPath } from "@/lib/kyc/doc-access";
import { confirmContactVerification } from "@/lib/kyc/verify";
import { hashVerificationCode, VERIFY_CODE_TTL_MS } from "@/modules/kyc/verify";
import { validateWithdrawal } from "@/modules/wallet/withdrawal";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);
let seq = 0;
const uniquePhone = () =>
  `+91${9_000_000_000 + ((Number(runId) + seq++) % 1_000_000_000)}`;

async function makeUserWithKyc(kyc: Record<string, unknown>): Promise<string> {
  const u = await prisma.user.create({
    data: {
      phone: uniquePhone(),
      referralCode: `GK${runId}${seq}`.toUpperCase(),
    },
    select: { id: true },
  });
  await prisma.kyc.create({ data: { userId: u.id, ...kyc } });
  return u.id;
}

describe.skipIf(!HAS_DB)("KYC Phase C (integration §6)", () => {
  beforeAll(() => {
    process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("PAN + account are stored as ciphertext and displayed masked (never in the clear)", async () => {
    const userId = await makeUserWithKyc({
      panEnc: encryptPii("ABCDE1234F"),
      accountNoEnc: encryptPii("123456789012"),
      accountHolderEnc: encryptPii("Asha Rao"),
      ifsc: "SBIN0001234",
      status: "SUBMITTED",
      submittedAt: new Date(),
    });

    // Stored column is ciphertext (iv:tag:ct), NOT the raw value.
    const raw = await prisma.kyc.findUniqueOrThrow({
      where: { userId },
      select: { panEnc: true, accountNoEnc: true },
    });
    expect(raw.panEnc).not.toContain("ABCDE1234F");
    expect(raw.panEnc?.split(":")).toHaveLength(3);

    const view = await getKycView(userId);
    expect(view.panMasked).toBe("•••• 234F");
    expect(view.accountMasked).toBe("•••• 9012");
    expect(view.panMasked).not.toContain("ABCDE1"); // no full PAN
  });

  it("email verify flag is set ONLY on a correct code", async () => {
    const target = `t${runId}@example.com`;
    const userId = await makeUserWithKyc({ email: target });
    await prisma.contactVerification.create({
      data: {
        userId,
        channel: "email",
        target,
        codeHash: hashVerificationCode("654321"),
        expiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS),
      },
    });

    // Wrong code → flag stays null.
    const bad = await confirmContactVerification(
      userId,
      "email",
      target,
      "000000",
    );
    expect(bad.ok).toBe(false);
    expect((await getKycView(userId)).emailVerified).toBe(false);

    // Correct code → flag set, code consumed (single-use).
    const good = await confirmContactVerification(
      userId,
      "email",
      target,
      "654321",
    );
    expect(good.ok).toBe(true);
    expect((await getKycView(userId)).emailVerified).toBe(true);

    // Re-using the same code fails (already consumed).
    const replay = await confirmContactVerification(
      userId,
      "email",
      target,
      "654321",
    );
    expect(replay.ok).toBe(false);
  });

  it("document object paths are encrypted at rest and decrypt server-side only", async () => {
    const path = `${runId}/pan/secret.pdf`;
    const userId = await makeUserWithKyc({ panDocEnc: encryptPii(path) });

    const raw = await prisma.kyc.findUniqueOrThrow({
      where: { userId },
      select: { panDocEnc: true },
    });
    expect(raw.panDocEnc).not.toContain("secret.pdf"); // ciphertext, not the path
    expect(await resolveKycDocPath(userId, "pan")).toBe(path); // server decrypts
    expect((await getKycView(userId)).docs.pan).toBe(true);
  });

  it("a non-APPROVED KYC blocks withdrawal (KYC gate, §6)", async () => {
    const userId = await makeUserWithKyc({
      status: "SUBMITTED",
      submittedAt: new Date(),
    });
    expect(await getKycStatus(userId)).toBe("SUBMITTED");
    const check = validateWithdrawal({
      payoutsEnabled: true, // isolate the KYC gate from the D-01 gate
      kycStatus: "SUBMITTED",
      hasPendingWithdrawal: false,
      availableInPaise: 100_000,
      amountInPaise: 50_000,
    });
    expect(check.ok).toBe(false);
    expect(check.ok === false && check.code).toBe("KYC_REQUIRED");
  });
});
