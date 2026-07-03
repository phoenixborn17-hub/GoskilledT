// Seed — DR-021 packaging + DR-010 pricing + system ledger accounts + a full DR-029 dev/staging
// dataset. Idempotent: safe to re-run. Money in PAISE, GST-inclusive display prices (Rule 12).
//
// DR-029 test-data policy: the two LAUNCH courses carry a clear "[PLACEHOLDER]" marker in their
// titles and use MOCK video assets — this is staging content standing in for the real recorded
// lessons (LAUNCH_CONFIG #7/#8), never presented as final. The 5 COMING_SOON courses are the
// honest DR-011 roadmap (no content yet, truthfully "coming soon"). Nothing fabricated.
import { PrismaClient, type AccountType } from "../lib/generated/prisma";

const prisma = new PrismaClient();

// One placeholder curriculum shape reused for both launch courses. Lesson 1 = free preview.
function curriculumFor(slug: string) {
  return [
    {
      id: `${slug}-m1`,
      title: "Module 1 — Foundations",
      order: 1,
      lessons: [
        { n: 1, title: "Welcome & overview", dur: 300, free: true },
        { n: 2, title: "Core concepts", dur: 420, free: false },
        { n: 3, title: "Common mistakes to avoid", dur: 360, free: false },
      ],
    },
    {
      id: `${slug}-m2`,
      title: "Module 2 — Putting it to work",
      order: 2,
      lessons: [
        { n: 1, title: "Hands-on walkthrough", dur: 480, free: false },
        { n: 2, title: "Real-world example", dur: 500, free: false },
        { n: 3, title: "Your next steps", dur: 540, free: false },
      ],
    },
  ];
}

async function seedCurriculum(courseId: string, slug: string) {
  const modules = curriculumFor(slug);
  const intendedModuleIds = modules.map((m) => m.id);

  // Self-heal: remove any pre-existing modules for this course NOT in the intended set (e.g. from
  // an older id scheme) so the course ends with EXACTLY this curriculum. Delete children first
  // (lesson progress → lessons → modules). Certificates reference the course, not lessons — kept.
  const stray = await prisma.module.findMany({
    where: { courseId, id: { notIn: intendedModuleIds } },
    select: { id: true },
  });
  if (stray.length > 0) {
    const strayModuleIds = stray.map((s) => s.id);
    const strayLessons = await prisma.lesson.findMany({
      where: { moduleId: { in: strayModuleIds } },
      select: { id: true },
    });
    const strayLessonIds = strayLessons.map((l) => l.id);
    if (strayLessonIds.length > 0) {
      await prisma.lessonProgress.deleteMany({
        where: { lessonId: { in: strayLessonIds } },
      });
      await prisma.lesson.deleteMany({ where: { id: { in: strayLessonIds } } });
    }
    await prisma.module.deleteMany({ where: { id: { in: strayModuleIds } } });
  }

  for (const m of modules) {
    await prisma.module.upsert({
      where: { id: m.id },
      update: { title: m.title, order: m.order, courseId },
      create: { id: m.id, title: m.title, order: m.order, courseId },
    });
    for (const l of m.lessons) {
      const id = `${m.id}-l${l.n}`;
      const data = {
        title: `[PLACEHOLDER] ${l.title}`,
        durationSec: l.dur,
        videoAssetId: `mock-${id}`, // any id → the mock provider maps it to a sample MP4
        order: l.n,
        isFreePreview: l.free,
        moduleId: m.id,
      };
      await prisma.lesson.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    }
  }
}

async function main() {
  // ── Launch courses (2) — PUBLISHED, [PLACEHOLDER] titles, mock video, full curriculum ──────
  const launch = [
    {
      slug: "ai-prompt-mastery",
      title: "AI Prompt Mastery [PLACEHOLDER]",
      summary: "Master practical AI prompting for real work.",
      category: "AI",
      order: 1,
    },
    {
      slug: "digital-marketing",
      title: "Digital Marketing [PLACEHOLDER]",
      summary: "Grow brands with modern digital marketing.",
      category: "Marketing",
      order: 2,
    },
  ];
  const launchIds: string[] = [];
  for (const c of launch) {
    const row = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        summary: c.summary,
        category: c.category,
        status: "PUBLISHED",
        order: c.order,
      },
      create: { ...c, status: "PUBLISHED" },
      select: { id: true },
    });
    launchIds.push(row.id);
    await seedCurriculum(row.id, c.slug);
  }

  // ── Coming-soon roadmap (5) — DR-011 catalog. Honest "coming soon", no content, no placeholder. ──
  const comingSoon = [
    {
      slug: "stock-market",
      title: "Stock Market",
      category: "Finance",
      summary: "Understand investing and the stock market from the ground up.",
    },
    {
      slug: "social-media-mastery",
      title: "Social Media Mastery",
      category: "Marketing",
      summary: "Build and grow an audience across social platforms.",
    },
    {
      slug: "no-code-ai-website",
      title: "No-Code + AI Website Development",
      category: "Tech",
      summary:
        "Build real websites with no-code tools and AI — no coding required.",
    },
    {
      slug: "ai-content-creation",
      title: "AI Content Creation",
      category: "AI",
      summary: "Create content faster with AI, the right way.",
    },
    {
      slug: "personality-development",
      title: "Personality Development",
      category: "Skills",
      summary: "Communication, confidence, and everyday soft skills.",
    },
  ];
  for (let i = 0; i < comingSoon.length; i++) {
    const c = comingSoon[i];
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        summary: c.summary,
        category: c.category,
        status: "COMING_SOON",
        order: 10 + i,
      },
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        category: c.category,
        status: "COMING_SOON",
        order: 10 + i,
      },
    });
  }

  // ── Packages (DR-021 / DR-010) ─────────────────────────────────────────────
  const skillBuilder = await prisma.package.upsert({
    where: { slug: "skill-builder" },
    update: {
      name: "Skill Builder",
      priceInPaise: 149900,
      includesFutureCourses: false,
      isActive: true,
    },
    create: {
      slug: "skill-builder",
      name: "Skill Builder",
      priceInPaise: 149900,
      includesFutureCourses: false,
      isActive: true,
    },
    select: { id: true },
  });
  const careerBooster = await prisma.package.upsert({
    where: { slug: "career-booster" },
    update: {
      name: "Career Booster",
      priceInPaise: 219900,
      includesFutureCourses: true,
      isActive: true,
    },
    create: {
      slug: "career-booster",
      name: "Career Booster",
      priceInPaise: 219900,
      includesFutureCourses: true,
      isActive: true,
    },
    select: { id: true },
  });

  // Both launch courses belong to both packages (SB buyer picks one; CB gets both).
  for (const packageId of [skillBuilder.id, careerBooster.id]) {
    for (const courseId of launchIds) {
      await prisma.packageCourse.upsert({
        where: { packageId_courseId: { packageId, courseId } },
        update: {},
        create: { packageId, courseId },
      });
    }
  }

  // ── System ledger accounts (userId = null; USER_WALLET created on demand) ────
  const systemAccounts: AccountType[] = [
    "REVENUE",
    "COMMISSION_PAYABLE",
    "PAYOUT_CLEARING",
    "GST_PAYABLE",
  ];
  for (const type of systemAccounts) {
    const exists = await prisma.ledgerAccount.findFirst({
      where: { type, userId: null },
      select: { id: true },
    });
    if (!exists) await prisma.ledgerAccount.create({ data: { type } });
  }

  console.log(
    "Seed complete: 2 launch courses ([PLACEHOLDER], PUBLISHED, 2 modules × 3 lessons, mock video), " +
      "5 coming-soon courses (DR-011), 2 packages, 4 package-course links, 4 system ledger accounts.",
  );
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
