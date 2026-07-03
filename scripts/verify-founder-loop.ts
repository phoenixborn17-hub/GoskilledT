// Verify the full founder-testable loop with PAYMENT_PROVIDER=mock (no live providers needed):
//   checkout → access (≤60s) → player → complete → certificate → verify.
// Runs the REAL money pipeline (startCheckout → signed webhook → handleRazorpayWebhook), then the
// LMS + certificate paths. Prints a ✓ at each step. Safe to re-run (creates a throwaway buyer).
//
//   npm run verify:loop
//
// It creates one test buyer (referralCode "LMSLOOP…" so scripts/purge-test-data catches it).
import { PrismaClient } from "../lib/generated/prisma";
import { startCheckout } from "../lib/payments/checkout";
import { getPaymentProvider } from "../lib/payments/provider";
import { buildSignedCapture } from "../lib/payments/dev-webhook";
import { handleRazorpayWebhook } from "../lib/payments/webhook";
import { completeLesson } from "../lib/lms/queries";
import {
  issueCertificateIfEligible,
  getCertificateBySerial,
} from "../lib/lms/certificate";

const prisma = new PrismaClient();

function ok(msg: string) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}
function fail(msg: string): never {
  console.error(`  \x1b[31m✗ ${msg}\x1b[0m`);
  process.exitCode = 1;
  throw new Error(msg);
}

async function main() {
  // Mock mode + a local webhook secret (the dev simulator signs with the same one).
  process.env.PAYMENT_PROVIDER = "mock";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_dev_local_mock";
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;

  console.log(
    "\nFounder loop — checkout → access → player → complete → certificate → verify\n",
  );

  const provider = getPaymentProvider();
  if (provider.name !== "mock")
    fail(`Expected PAYMENT_PROVIDER=mock, got "${provider.name}"`);
  ok(`payment provider = mock`);

  // Seeded launch course (Career Booster grants both; we drive one to a certificate).
  const course = await prisma.course.findUnique({
    where: { slug: "ai-prompt-mastery" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course || course.status !== "PUBLISHED")
    fail(
      "Seed missing: run `npm run db:seed` first (ai-prompt-mastery PUBLISHED).",
    );
  const lessonIds = course!.modules.flatMap((m) => m.lessons.map((l) => l.id));
  if (lessonIds.length === 0) fail("Seed missing: course has no lessons.");

  // Throwaway buyer (simulates a synced, post-OTP user).
  const phone10 = String(Date.now()).slice(-10);
  const buyer = await prisma.user.create({
    data: {
      phone: `+91${phone10}`,
      referralCode: `LMSLOOP${Date.now()}`.toUpperCase(),
      isVerified: true,
    },
    select: { id: true },
  });
  ok(`test buyer created (${phone10})`);

  // 1) Checkout — Career Booster (both launch courses).
  const order = await startCheckout(
    { packageSlug: "career-booster", phone: phone10 },
    (i) => provider.createOrder(i),
  );
  ok(
    `checkout → order ${order.razorpayOrderId} (${order.amountInPaise} paise)`,
  );

  // 2) Payment webhook (signed, mock) → the REAL pipeline → PAID + enrollments (access ≤60s).
  const signed = buildSignedCapture({
    razorpayOrderId: order.razorpayOrderId,
    amountInPaise: order.amountInPaise,
    webhookSecret: secret,
  });
  const res = await handleRazorpayWebhook(
    signed.body,
    signed.signature,
    signed.eventId,
  );
  if (res.status !== 200) fail(`webhook returned ${res.status}`);
  const paid = await prisma.order.findUniqueOrThrow({
    where: { id: order.orderId },
  });
  if (paid.status !== "PAID")
    fail(`order status = ${paid.status}, expected PAID`);
  const enrollments = await prisma.enrollment.count({
    where: { userId: buyer.id },
  });
  if (enrollments < 1) fail("no enrollments created");
  ok(
    `payment verified → PAID → access granted (${enrollments} enrollments, instant)`,
  );

  // 3) Player → complete every lesson.
  for (const lessonId of lessonIds) await completeLesson(buyer.id, lessonId);
  const { progress } = await completeLesson(
    buyer.id,
    lessonIds[lessonIds.length - 1],
  );
  if (progress.percent !== 100)
    fail(`progress = ${progress.percent}%, expected 100%`);
  ok(`completed all ${lessonIds.length} lessons → 100%`);

  // 4) Certificate issued on 100%.
  const cert = await issueCertificateIfEligible(buyer.id, course!.id);
  if (!cert) fail("certificate not issued at 100%");
  ok(`certificate issued: ${cert!.serial}`);

  // 5) Public verify.
  const v = await getCertificateBySerial(cert!.serial);
  if (!v.valid) fail("certificate did not verify");
  ok(
    `verify → VALID · ${v.courseTitle} · issued ${v.issuedAt?.toDateString()}`,
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log(
    `\n\x1b[32mLoop OK.\x1b[0m Open the verify page: ${appUrl}/verify/${cert!.serial}\n`,
  );
}

main()
  .catch((e) => {
    console.error(
      "\nfounder-loop verification FAILED:",
      e instanceof Error ? e.message : e,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
