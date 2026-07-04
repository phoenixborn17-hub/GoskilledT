// GPS-M4 §2.2 — KYC review path (shared DB). Asserts: detail is masked by default (no full PII),
// reveal returns full PII AND logs KYC_VIEWED, a decision flips status + audits, and a non-SUBMITTED
// record is not reviewable. runId prefix so purge-test-data catches the rows.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getKycReviewDetail,
  revealKyc,
  reviewKyc,
  listKycQueue,
} from "@/lib/admin/kyc";
import { encryptPii } from "@/lib/pii";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = `m4kyc${Date.now()}`;
const actor = { supabaseId: `admin_${runId}`, email: "admin@example.com" };

async function submittedKyc(tag: string): Promise<string> {
  const u = await prisma.user.create({
    data: {
      phone: `+91${Math.floor(9e9 + Math.random() * 1e9)}`,
      referralCode: `${runId}${tag}`.toUpperCase(),
      name: `KYC ${tag}`,
    },
    select: { id: true },
  });
  await prisma.kyc.create({
    data: {
      userId: u.id,
      panEnc: encryptPii("ABCDE1234F"),
      accountNoEnc: encryptPii("123456789012"),
      accountHolderEnc: encryptPii("Kyc User"),
      ifsc: "SBIN0001234",
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
  return u.id;
}

describe.skipIf(!HAS_DB)("KYC review (integration)", () => {
  beforeAll(() => {
    process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("detail is masked by default — never full PAN/account", async () => {
    const userId = await submittedKyc("A");
    const detail = await getKycReviewDetail(userId);
    expect(detail).not.toBeNull();
    expect(detail!.status).toBe("SUBMITTED");
    expect(detail!.panMasked).toBe("•••• 234F");
    expect(detail!.accountMasked).toBe("•••• 9012");
    expect(detail!.holderName).toBe("Kyc User");
    // No property anywhere exposes the full PAN.
    expect(JSON.stringify(detail)).not.toContain("ABCDE1234F");
    expect(JSON.stringify(detail)).not.toContain("123456789012");
  });

  it("queue lists submitted records with phone only (no PII)", async () => {
    const userId = await submittedKyc("Q");
    const queue = await listKycQueue();
    const row = queue.find((r) => r.userId === userId);
    expect(row).toBeDefined();
    expect(JSON.stringify(queue)).not.toContain("ABCDE1234F");
  });

  it("reveal returns full PII and logs KYC_VIEWED", async () => {
    const userId = await submittedKyc("B");
    const revealed = await revealKyc(actor, userId);
    expect(revealed.pan).toBe("ABCDE1234F");
    expect(revealed.accountNumber).toBe("123456789012");

    const audit = await prisma.adminAction.findFirst({
      where: { action: "KYC_VIEWED", entity: "Kyc", entityId: userId },
    });
    expect(audit).not.toBeNull();
    expect(audit!.actorSupabaseId).toBe(actor.supabaseId);
    // The audit row itself carries no PII.
    expect(JSON.stringify(audit!.meta ?? {})).not.toContain("ABCDE1234F");
  });

  it("approve flips status to APPROVED and audits KYC_APPROVED", async () => {
    const userId = await submittedKyc("C");
    const res = await reviewKyc(actor, userId, "APPROVE");
    expect(res.ok).toBe(true);

    const kyc = await prisma.kyc.findUniqueOrThrow({
      where: { userId },
      select: { status: true },
    });
    expect(kyc.status).toBe("APPROVED");

    const audit = await prisma.adminAction.findFirst({
      where: { action: "KYC_APPROVED", entityId: userId },
    });
    expect(audit).not.toBeNull();
  });

  it("reject requires a reason and records it; re-review is refused", async () => {
    const userId = await submittedKyc("D");
    expect((await reviewKyc(actor, userId, "REJECT")).ok).toBe(false);

    const ok = await reviewKyc(actor, userId, "REJECT", "PAN photo unreadable");
    expect(ok.ok).toBe(true);
    const audit = await prisma.adminAction.findFirst({
      where: { action: "KYC_REJECTED", entityId: userId },
    });
    expect((audit!.meta as { reason?: string }).reason).toBe(
      "PAN photo unreadable",
    );

    // Already decided → not reviewable again.
    expect((await reviewKyc(actor, userId, "APPROVE")).ok).toBe(false);
  });
});
