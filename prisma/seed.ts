// Seed — DR-021 packaging + DR-010 pricing + system ledger accounts.
// Idempotent: safe to re-run. Money in PAISE, GST-inclusive display prices (Golden Rule 12).
import { PrismaClient, type AccountType } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // ── Courses (2 launch courses) ─────────────────────────────────────────────
  const aiPrompt = await prisma.course.upsert({
    where: { slug: "ai-prompt-mastery" },
    update: { title: "AI Prompt Mastery", status: "PUBLISHED", category: "AI", order: 1 },
    create: { slug: "ai-prompt-mastery", title: "AI Prompt Mastery", summary: "Master practical AI prompting for real work.", category: "AI", status: "PUBLISHED", order: 1 },
    select: { id: true },
  });

  const digitalMarketing = await prisma.course.upsert({
    where: { slug: "digital-marketing" },
    update: { title: "Digital Marketing", status: "COMING_SOON", category: "Marketing", order: 2 },
    create: { slug: "digital-marketing", title: "Digital Marketing", summary: "Grow brands with modern digital marketing.", category: "Marketing", status: "COMING_SOON", order: 2 },
    select: { id: true },
  });

  // ── Packages (DR-021 / DR-010) ─────────────────────────────────────────────
  // Skill Builder ₹1,499 = 149900 paise — buyer's choice of ONE launch course (no future courses).
  const skillBuilder = await prisma.package.upsert({
    where: { slug: "skill-builder" },
    update: { name: "Skill Builder", priceInPaise: 149900, includesFutureCourses: false, isActive: true },
    create: { slug: "skill-builder", name: "Skill Builder", priceInPaise: 149900, includesFutureCourses: false, isActive: true },
    select: { id: true },
  });

  // Career Booster ₹2,199 = 219900 paise — BOTH launch courses + future courses as released.
  const careerBooster = await prisma.package.upsert({
    where: { slug: "career-booster" },
    update: { name: "Career Booster", priceInPaise: 219900, includesFutureCourses: true, isActive: true },
    create: { slug: "career-booster", name: "Career Booster", priceInPaise: 219900, includesFutureCourses: true, isActive: true },
    select: { id: true },
  });

  // ── PackageCourse links ────────────────────────────────────────────────────
  // Both launch courses belong to both packages: Skill Builder buyer picks one; Career Booster gets all.
  const links: Array<{ packageId: string; courseId: string }> = [
    { packageId: skillBuilder.id, courseId: aiPrompt.id },
    { packageId: skillBuilder.id, courseId: digitalMarketing.id },
    { packageId: careerBooster.id, courseId: aiPrompt.id },
    { packageId: careerBooster.id, courseId: digitalMarketing.id },
  ];
  for (const link of links) {
    await prisma.packageCourse.upsert({
      where: { packageId_courseId: link },
      update: {},
      create: link,
    });
  }

  // ── AI & Prompt Mastery curriculum (Ticket 4): 2 modules × 3 lessons ─────────
  // Explicit ids make the seed idempotent (Module/Lesson have no natural unique key).
  // First lesson is a free preview; every lesson carries a mock videoAssetId.
  const curriculum = [
    {
      id: "aipm-m1", title: "Foundations of Prompting", order: 1,
      lessons: [
        { id: "aipm-m1-l1", title: "What is a Prompt?", durationSec: 300, videoAssetId: "mock-aipm-101", order: 1, isFreePreview: true },
        { id: "aipm-m1-l2", title: "Anatomy of a Great Prompt", durationSec: 420, videoAssetId: "mock-aipm-102", order: 2, isFreePreview: false },
        { id: "aipm-m1-l3", title: "Common Prompting Mistakes", durationSec: 360, videoAssetId: "mock-aipm-103", order: 3, isFreePreview: false },
      ],
    },
    {
      id: "aipm-m2", title: "Prompting for Real Work", order: 2,
      lessons: [
        { id: "aipm-m2-l1", title: "Prompts for Writing", durationSec: 480, videoAssetId: "mock-aipm-201", order: 1, isFreePreview: false },
        { id: "aipm-m2-l2", title: "Prompts for Analysis", durationSec: 500, videoAssetId: "mock-aipm-202", order: 2, isFreePreview: false },
        { id: "aipm-m2-l3", title: "Building Prompt Workflows", durationSec: 540, videoAssetId: "mock-aipm-203", order: 3, isFreePreview: false },
      ],
    },
  ];
  for (const m of curriculum) {
    await prisma.module.upsert({
      where: { id: m.id },
      update: { title: m.title, order: m.order, courseId: aiPrompt.id },
      create: { id: m.id, title: m.title, order: m.order, courseId: aiPrompt.id },
    });
    for (const l of m.lessons) {
      await prisma.lesson.upsert({
        where: { id: l.id },
        update: { title: l.title, durationSec: l.durationSec, videoAssetId: l.videoAssetId, order: l.order, isFreePreview: l.isFreePreview, moduleId: m.id },
        create: { id: l.id, title: l.title, durationSec: l.durationSec, videoAssetId: l.videoAssetId, order: l.order, isFreePreview: l.isFreePreview, moduleId: m.id },
      });
    }
  }

  // ── System ledger accounts (userId = null; USER_WALLET created on demand) ────
  const systemAccounts: AccountType[] = ["REVENUE", "COMMISSION_PAYABLE", "PAYOUT_CLEARING", "GST_PAYABLE"];
  for (const type of systemAccounts) {
    const exists = await prisma.ledgerAccount.findFirst({ where: { type, userId: null }, select: { id: true } });
    if (!exists) await prisma.ledgerAccount.create({ data: { type } });
  }

  console.log("Seed complete: 2 packages, 2 courses (AI & Prompt Mastery: 2 modules × 3 lessons, published), 4 package-course links, 4 system ledger accounts.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
