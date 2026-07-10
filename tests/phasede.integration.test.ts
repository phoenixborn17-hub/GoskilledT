// Phase D/E (integration, live DB) — leaderboard ranks by COMPLETION not team-size (DR-034/035),
// rewards progress derives from canon, affiliate leads encrypt PII + are owner-scoped, admin KPIs
// aggregate real data. No money moves.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getMyLeaderboardStanding } from "@/lib/affiliate/leaderboard";
import { completedReferralCount } from "@/lib/affiliate/completion";
import { getRewardProgress } from "@/lib/affiliate/rewards";
import { createAffiliateLead, listAffiliateLeads } from "@/lib/affiliate/leads";
import { getAdminKpis } from "@/lib/admin/kpi";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);
let seq = 0;
const uniquePhone = () =>
  `+91${9_000_000_000 + ((Number(runId) + seq++) % 1_000_000_000)}`;

async function makeUser(referredById: string | null): Promise<string> {
  const u = await prisma.user.create({
    data: {
      phone: uniquePhone(),
      referralCode: `PDE${runId}${seq}`.toUpperCase(),
      referredById,
    },
    select: { id: true },
  });
  return u.id;
}
async function complete(userId: string, courseId: string) {
  await prisma.certificate.create({
    data: { userId, courseId, serial: `CERT-${runId}-${seq++}` },
  });
}

describe.skipIf(!HAS_DB)("Phase D/E (integration)", () => {
  let courseId: string;
  let referrer: string; // 2 completed referrals
  let bigTeamNoCompletions: string; // 5 downlines, 0 completions

  beforeAll(async () => {
    process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
    const c = await prisma.course.upsert({
      where: { slug: "ai-prompt-mastery" },
      update: {},
      create: {
        slug: "ai-prompt-mastery",
        title: "AI Prompt Mastery",
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    courseId = c.id;

    referrer = await makeUser(null);
    const d1 = await makeUser(referrer);
    const d2 = await makeUser(referrer);
    await makeUser(referrer); // a 3rd downline who has NOT completed
    await complete(d1, courseId);
    await complete(d2, courseId);

    // A referrer with a BIG team but ZERO completions — must NOT rank (team-size ≠ ranking, DR-035).
    bigTeamNoCompletions = await makeUser(null);
    for (let i = 0; i < 5; i++) await makeUser(bigTeamNoCompletions);
  });

  it("leaderboard counts referred learners who COMPLETED a course (DR-034)", async () => {
    expect(await completedReferralCount(referrer)).toBe(2);
    const standing = await getMyLeaderboardStanding(referrer);
    expect(standing?.completedReferrals).toBe(2);
  });

  it("a big team with zero completions does NOT rank (team-size never ranks, DR-035)", async () => {
    expect(await completedReferralCount(bigTeamNoCompletions)).toBe(0);
    expect(await getMyLeaderboardStanding(bigTeamNoCompletions)).toBeNull();
  });

  it("reward progress derives from completed-referrals", async () => {
    const reward = await prisma.rewardDefinition.create({
      data: {
        title: `R${runId}`,
        target: 2,
        metric: "completed_referrals",
        isActive: true,
      },
      select: { id: true },
    });
    const progress = await getRewardProgress(referrer);
    const mine = progress.find((p) => p.id === reward.id);
    expect(mine).toBeTruthy();
    expect(mine!.current).toBe(2);
    expect(mine!.achieved).toBe(true);
    expect(mine!.percent).toBe(100);
  });

  it("affiliate leads encrypt PII at rest and are owner-scoped", async () => {
    const owner = await makeUser(null);
    const other = await makeUser(null);
    const created = await createAffiliateLead(owner, {
      name: "Priya",
      phone: "9876500011",
      email: "priya@example.com",
    });
    expect(created.ok).toBe(true);

    // Stored ciphertext, not the raw number.
    const raw = await prisma.affiliateLead.findFirstOrThrow({
      where: { ownerId: owner },
      select: { phoneEnc: true },
    });
    expect(raw.phoneEnc).not.toContain("9876500011");
    expect(raw.phoneEnc.split(":")).toHaveLength(3);

    // Owner sees their own lead decrypted; another affiliate sees none of them.
    const mine = await listAffiliateLeads(owner);
    expect(mine).toHaveLength(1);
    expect(mine[0].phone).toBe("+919876500011");
    expect(await listAffiliateLeads(other)).toHaveLength(0);
  });

  it("invalid lead phone is rejected before storage", async () => {
    const owner = await makeUser(null);
    const bad = await createAffiliateLead(owner, { phone: "123" });
    expect(bad.ok).toBe(false);
    expect(await listAffiliateLeads(owner)).toHaveLength(0);
  });

  it("admin KPIs aggregate real data into series + snapshots (no throw, honest shape)", async () => {
    const kpis = await getAdminKpis();
    expect(Array.isArray(kpis.registrations)).toBe(true);
    expect(Array.isArray(kpis.withdrawalsByStatus)).toBe(true);
    expect(typeof kpis.commissionsHeldInPaise).toBe("number");
    expect(typeof kpis.commissionsAvailableInPaise).toBe("number");
    // Each categorical point is well-formed.
    for (const p of kpis.kycPipeline) {
      expect(p).toHaveProperty("key");
      expect(p).toHaveProperty("value");
      expect(p.value).toBeGreaterThanOrEqual(0);
    }
  });
});
