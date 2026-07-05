// GPS-M5 §2.4 — idempotent + opt-out-aware sends (live DB). The observable contract is the EmailLog
// send-log: a claim row means "attempted at-most-once"; no row means suppressed (no email / opt-out).
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  maybeSendWelcomeEmail,
  maybeSendCertificateEmail,
} from "@/lib/email/notify";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = `lmsnotif${Date.now()}`;
let n = 0;
async function makeUser(opts: { email?: string | null; optOut?: boolean }) {
  n++;
  const u = await prisma.user.create({
    data: {
      phone: `+9198${String(Date.now()).slice(-7)}${n}`.slice(0, 13),
      referralCode: `${runId}${n}`.toUpperCase(),
      name: "Notify Learner",
      email: opts.email === undefined ? `${runId}${n}@example.com` : opts.email,
      emailOptOut: opts.optOut ?? null,
    },
    select: { id: true },
  });
  return u.id;
}

describe.skipIf(!HAS_DB)("notifications: idempotent + opt-out", () => {
  it("welcome: sends once (claim logged), never twice", async () => {
    const userId = await makeUser({});
    await maybeSendWelcomeEmail(userId);
    await maybeSendWelcomeEmail(userId); // idempotent
    expect(
      await prisma.emailLog.count({ where: { userId, kind: "welcome" } }),
    ).toBe(1);
  });

  it("welcome: hard opt-out suppresses the send (no claim)", async () => {
    const userId = await makeUser({ optOut: true });
    await maybeSendWelcomeEmail(userId);
    expect(await prisma.emailLog.count({ where: { userId } })).toBe(0);
  });

  it("welcome: no email → no send", async () => {
    const userId = await makeUser({ email: null });
    await maybeSendWelcomeEmail(userId);
    expect(await prisma.emailLog.count({ where: { userId } })).toBe(0);
  });

  it("certificate-ready: dedupes by serial; opt-out respected", async () => {
    const userId = await makeUser({});
    const course = await prisma.course.create({
      data: {
        slug: `notif-${runId}`,
        title: "Notif Course",
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    await prisma.certificate.create({
      data: {
        userId,
        courseId: course.id,
        serial: `GS-${runId.slice(-5).toUpperCase()}-NOTIF`,
      },
    });
    await maybeSendCertificateEmail(userId, course.id);
    await maybeSendCertificateEmail(userId, course.id);
    expect(
      await prisma.emailLog.count({
        where: { userId, kind: "certificate_ready" },
      }),
    ).toBe(1);

    // Opted-out user with a cert → suppressed.
    const optUser = await makeUser({ optOut: true });
    await prisma.certificate.create({
      data: {
        userId: optUser,
        courseId: course.id,
        serial: `GS-${runId.slice(-5).toUpperCase()}-OPTOUT`,
      },
    });
    await maybeSendCertificateEmail(optUser, course.id);
    expect(await prisma.emailLog.count({ where: { userId: optUser } })).toBe(0);
  });
});
