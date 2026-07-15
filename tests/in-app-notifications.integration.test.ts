// Feature Batch v1.0 §1 — notify() event hooks for the NEW in-app Notification model (distinct
// from tests/notifications.integration.test.ts, which covers the pre-existing EmailLog feature).
// Copy/DR-043 correctness + the milestone dedup (the one event type with no discrete write-
// transition — see lib/notifications/notify.ts header for why).
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  notify,
  notifyCommissionCredited,
  notifyKycStatus,
  notifyWithdrawalPaid,
  notifyCertificateIssued,
  notifyMilestoneIfNew,
} from "@/lib/notifications/notify";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);

describe.skipIf(!HAS_DB)("notify() event hooks (in-app Notification)", () => {
  let seq = 0;
  async function makeUser(tag: string) {
    seq++;
    const u = await prisma.user.create({
      data: {
        supabaseId: `sb_notif_${tag}_${runId}`,
        phone: `+9199${runId}${seq}`,
        referralCode: `RCNOTIF${tag}${runId}`,
      },
      select: { id: true },
    });
    return u.id;
  }

  it("inserts a Notification row with the given fields", async () => {
    const userId = await makeUser("plain");
    await notify({
      userId,
      type: "CERTIFICATE_ISSUED",
      title: "Certificate earned",
      body: "Your certificate for X is ready.",
      linkUrl: "/dashboard/progress",
    });
    const rows = await prisma.notification.findMany({ where: { userId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].readAt).toBeNull();
  });

  it("never throws when the insert fails (bad FK userId) — fail-safe by contract", async () => {
    await expect(
      notify({
        userId: "does-not-exist",
        type: "MILESTONE",
        title: "x",
        body: "y",
      }),
    ).resolves.toBeUndefined();
  });

  it("DR-043: commission-credited copy says 'recorded', never 'available'/'ready to withdraw'", async () => {
    const userId = await makeUser("comm");
    await notifyCommissionCredited(userId, 15000);
    const row = await prisma.notification.findFirst({ where: { userId } });
    expect(row?.body).toContain("recorded");
    expect(row?.body.toLowerCase()).not.toContain("available");
    expect(row?.body.toLowerCase()).not.toContain("ready to withdraw");
    expect(row?.body).toContain("₹150");
  });

  it("withdrawal-paid copy is factual, past-tense", async () => {
    const userId = await makeUser("wd");
    await notifyWithdrawalPaid(userId, 90000);
    const row = await prisma.notification.findFirst({ where: { userId } });
    expect(row?.body).toBe("Withdrawal of ₹900 marked paid.");
    expect(row?.type).toBe("WITHDRAWAL_PAID");
  });

  it("KYC-status copy carries no PII (status word only)", async () => {
    const userId = await makeUser("kyc");
    await notifyKycStatus(userId, "APPROVED");
    const row = await prisma.notification.findFirst({ where: { userId } });
    expect(row?.body).toBe("Your KYC is now verified.");
  });

  it("certificate-issued links to /dashboard/progress", async () => {
    const userId = await makeUser("cert");
    await notifyCertificateIssued(userId, "AI & Prompt Mastery");
    const row = await prisma.notification.findFirst({ where: { userId } });
    expect(row?.linkUrl).toBe("/dashboard/progress");
    expect(row?.body).toContain("AI & Prompt Mastery");
  });

  it("drops an external linkUrl rather than rejecting the whole notification", async () => {
    const userId = await makeUser("extlink");
    await notify({
      userId,
      type: "MILESTONE",
      title: "t",
      body: "b",
      linkUrl: "https://evil.example.com",
    });
    const row = await prisma.notification.findFirst({ where: { userId } });
    expect(row?.linkUrl).toBeNull();
  });

  it("notifyMilestoneIfNew dedupes — a second call for the same milestone does NOT insert again", async () => {
    const userId = await makeUser("ms");
    await notifyMilestoneIfNew(userId, "Pehla lesson complete");
    await notifyMilestoneIfNew(userId, "Pehla lesson complete");
    const rows = await prisma.notification.findMany({
      where: { userId, type: "MILESTONE" },
    });
    expect(rows).toHaveLength(1);
  });

  it("notifyMilestoneIfNew fires separately for a DIFFERENT milestone", async () => {
    const userId = await makeUser("ms2");
    await notifyMilestoneIfNew(userId, "Pehla lesson complete");
    await notifyMilestoneIfNew(userId, "Pehla quiz pass");
    const rows = await prisma.notification.findMany({
      where: { userId, type: "MILESTONE" },
    });
    expect(rows).toHaveLength(2);
  });
});
