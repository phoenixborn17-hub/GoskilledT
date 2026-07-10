// Staging demo seed (founder review). Creates ONE loginable demo account with rich, HONEST data so
// the premium three-state dashboards render at their Active/Power states:
//   • enrolled course + completed lessons + a real certificate
//   • an L1/L2 referral network
//   • recorded (payouts-OFF) HELD commission earnings — through the REAL money pipeline
//     (startCheckout → signed payment.captured webhook → ledger), never hand-forged.
// STAGING/DEV ONLY. Idempotent: if the demo user already exists it prints the login and exits.
//
//   npx tsx scripts/seed-staging-demo.mts
//
// LOGIN (staging): the account is a phone-only User row; the founder logs in via the staging OTP
// bypass (phone + fixed code 123456), which get-or-creates the Supabase auth user and syncUser then
// ADOPTS this pre-seeded row by phone (rich data preserved). No service-role key needed.
import "dotenv/config"; // load .env before any lib import reads process.env
import { PrismaClient } from "../lib/generated/prisma/index.js";
import { startCheckout } from "../lib/payments/checkout";
import { handleRazorpayWebhook } from "../lib/payments/webhook";
import { buildSignedCapture } from "../lib/payments/dev-webhook";
import { completeLesson } from "../lib/lms/queries";
import { issueCertificateIfEligible } from "../lib/lms/certificate";

const prisma = new PrismaClient();

// ── Safety: never run against production ──
if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
  throw new Error("seed-staging-demo is a dev/staging tool — never run in production.");
}
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) throw new Error("RAZORPAY_WEBHOOK_SECRET required to sign the demo webhooks.");

const DEMO = {
  phone10: "9812340000",
  phoneE164: "+919812340000",
  otp: "123456", // staging fixed OTP (STAGING_OTP_CODE default)
  name: "Aarav (Demo)",
  referralCode: "GSDEMO01",
};
const PKG = "career-booster";

async function findPkgPrice(): Promise<number> {
  const p = await prisma.package.findUniqueOrThrow({ where: { slug: PKG }, select: { priceInPaise: true } });
  return p.priceInPaise;
}

// Drive a REAL paid purchase for a user identified by 10-digit phone: checkout → signed capture webhook.
async function purchase(phone10: string, tag: string, amountInPaise: number) {
  const rzpId = `order_rzp_demo_${tag}`;
  const { orderId, razorpayOrderId } = await startCheckout(
    { packageSlug: PKG, phone: phone10 },
    async () => ({ id: rzpId }),
  );
  const wh = buildSignedCapture({
    razorpayOrderId,
    amountInPaise,
    webhookSecret: WEBHOOK_SECRET!,
    paymentId: `pay_demo_${tag}`,
    eventId: `evt_demo_${tag}`,
  });
  const res = await handleRazorpayWebhook(wh.body, wh.signature, wh.eventId);
  if (res.status !== 200) throw new Error(`webhook for ${tag} returned ${res.status}`);
  return orderId;
}

// Create a data-only downline User (no Supabase auth needed — they're network + purchase fixtures).
async function makeDownline(tag: string, phone10: string, referredById: string) {
  return prisma.user.create({
    data: {
      phone: `+91${phone10}`,
      referralCode: `GSDEMO${tag}`.toUpperCase(),
      name: DOWNLINE_NAMES[tag] ?? `Friend ${tag}`,
      referredById,
      isVerified: true,
      onboardedAt: new Date(),
      welcomeSeenAt: new Date(),
    },
    select: { id: true, phone: true },
  });
}
const DOWNLINE_NAMES: Record<string, string> = {
  l1a: "Priya", l1b: "Rohan", l1c: "Sneha", l2a: "Arjun", l2b: "Kavya",
};

async function main() {
  // Idempotency guard.
  const existing = await prisma.user.findFirst({
    where: { referralCode: DEMO.referralCode },
    select: { id: true },
  });
  if (existing) {
    console.log("Demo already seeded. Login:");
    console.log(`  URL:   https://goskilled-t.vercel.app/login`);
    console.log(`  Phone: ${DEMO.phone10}   → "OTP instead" → code ${DEMO.otp}`);
    await prisma.$disconnect();
    return;
  }

  const price = await findPkgPrice();
  console.log(`Package ${PKG} = ${price} paise (₹${price / 100})`);

  // 1) Demo User row (top of the tree, no upline). Phone-only — the staging OTP-bypass login
  //    get-or-creates the Supabase auth user and syncUser adopts THIS row by phone (rich data kept).
  const demo = await prisma.user.create({
    data: {
      phone: DEMO.phoneE164,
      referralCode: DEMO.referralCode,
      name: DEMO.name,
      goal: "BOTH",
      isVerified: true,
      onboardedAt: new Date(),
      welcomeSeenAt: new Date(),
    },
    select: { id: true },
  });
  console.log(`✓ demo user ${demo.id} (phone ${DEMO.phoneE164})`);

  // 2) Demo's OWN purchase → PAID + enrolls in the launch courses + makes demo earning-eligible (DR-038).
  await purchase(DEMO.phone10, "own", price);
  console.log("✓ demo own purchase (eligibility + enrollments)");

  // 3) L1 + L2 network, each buying → demo earns HELD L1/L2 commissions through the ledger.
  const l1a = await makeDownline("l1a", "9812340011", demo.id);
  const l1b = await makeDownline("l1b", "9812340012", demo.id);
  const l1c = await makeDownline("l1c", "9812340013", demo.id);
  const l2a = await makeDownline("l2a", "9812340021", l1a.id);
  const l2b = await makeDownline("l2b", "9812340022", l1a.id);
  for (const [tag, u] of [
    ["l1a", l1a], ["l1b", l1b], ["l1c", l1c], ["l2a", l2a], ["l2b", l2b],
  ] as const) {
    await purchase(u.phone.replace("+91", ""), tag, price);
  }
  console.log("✓ network: 3 L1 + 2 L2, all purchased → HELD commissions to demo");

  // 4) Learning: complete ALL lessons of the demo's first PUBLISHED course → a real certificate.
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: demo.id },
    select: { courseId: true },
  });
  let certCourseId: string | null = null;
  for (const { courseId } of enrollments) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        status: true,
        modules: { select: { lessons: { select: { id: true } } } },
      },
    });
    if (course?.status !== "PUBLISHED") continue;
    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    if (lessonIds.length === 0) continue;
    for (const id of lessonIds) await completeLesson(demo.id, id);
    // Pass any PUBLISHED mandatory quizzes on this course so the cert gate (GPS-M5 §2.2) clears.
    const quizzes = await prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        isMandatory: true,
        publishedAt: { not: null },
        lesson: { module: { courseId } },
      },
      select: { id: true, questions: { select: { correctIndex: true } } },
    });
    for (const q of quizzes) {
      await prisma.quizAttempt.create({
        data: {
          quizId: q.id,
          userId: demo.id,
          score: q.questions.length,
          total: q.questions.length,
          passed: true,
          answers: q.questions.map((x) => x.correctIndex),
        },
      });
    }
    const cert = await issueCertificateIfEligible(demo.id, courseId);
    console.log(`✓ completed ${lessonIds.length} lessons of course ${courseId}; certificate=${cert?.serial ?? "gated"}`);
    certCourseId = courseId;
    break; // one completed course is enough for the demo
  }
  if (!certCourseId) console.log("! no PUBLISHED course with lessons found to complete");

  console.log("\n=== DEMO READY ===");
  console.log(`  URL:   https://goskilled-t.vercel.app/login`);
  console.log(`  Phone: ${DEMO.phone10}   → tap "OTP instead" → code ${DEMO.otp}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
