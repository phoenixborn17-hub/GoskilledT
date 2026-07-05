// GPS-M5 §2.4 — milestone email senders (welcome + certificate-ready). Best-effort (never breaks a
// flow), IDEMPOTENT (EmailLog claim-before-send → at-most-once), and OPT-OUT-aware (a hard emailOptOut
// suppresses even these). Copy builders are pure (lib/email/notifications); this is the thin adapter.
import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import { sendEmail } from "./send";
import { buildWelcomeEmail, buildCertificateReadyEmail } from "./notifications";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
// Unsubscribe token = the user's unguessable cuid (25 random chars). A dedicated signed token is a
// noted hardening follow-up; the cuid is non-enumerable, so this is safe for v1.
function unsubscribeUrl(userId: string): string {
  return `${appUrl()}/unsubscribe?u=${encodeURIComponent(userId)}`;
}

/** Claim a dedupe key by INSERTing the send-log row FIRST. Returns false if already claimed (P2002) or
 *  on any error — so a double-send is impossible and a hiccup fails safe (no send) rather than double. */
async function claim(
  userId: string,
  dedupeKey: string,
  kind: string,
): Promise<boolean> {
  try {
    await prisma.emailLog.create({ data: { userId, dedupeKey, kind } });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return false;
    console.warn(
      `[email] claim failed for "${dedupeKey}":`,
      e instanceof Error ? e.message : e,
    );
    return false;
  }
}

/** Welcome-on-first-email. Fires once the learner has an email + hasn't opted out. Idempotent. */
export async function maybeSendWelcomeEmail(userId: string): Promise<void> {
  let user: {
    email: string | null;
    name: string | null;
    emailOptOut: boolean | null;
  } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailOptOut: true },
    });
  } catch {
    return; // best-effort
  }
  if (!user?.email || user.emailOptOut === true) return; // no email yet, or hard opt-out

  if (!(await claim(userId, `welcome:${userId}`, "welcome"))) return; // already sent

  await sendEmail(
    buildWelcomeEmail({
      to: user.email,
      name: user.name,
      appUrl: appUrl(),
      unsubscribeUrl: unsubscribeUrl(userId),
    }),
  );
}

/** Certificate-ready. Fires once per issued certificate (dedupe by serial). Opt-out respected. */
export async function maybeSendCertificateEmail(
  userId: string,
  courseId: string,
): Promise<void> {
  let data: {
    email: string | null;
    name: string | null;
    emailOptOut: boolean | null;
    serial: string;
    courseTitle: string;
  } | null = null;
  try {
    const cert = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: {
        serial: true,
        course: { select: { title: true } },
        user: { select: { email: true, name: true, emailOptOut: true } },
      },
    });
    if (cert)
      data = {
        email: cert.user.email,
        name: cert.user.name,
        emailOptOut: cert.user.emailOptOut,
        serial: cert.serial,
        courseTitle: cert.course.title,
      };
  } catch {
    return;
  }
  if (!data) return; // no certificate issued
  if (!data.email || data.emailOptOut === true) return;

  if (!(await claim(userId, `cert-ready:${data.serial}`, "certificate_ready")))
    return;

  await sendEmail(
    buildCertificateReadyEmail({
      to: data.email,
      name: data.name,
      courseTitle: data.courseTitle,
      serial: data.serial,
      appUrl: appUrl(),
      unsubscribeUrl: unsubscribeUrl(userId),
    }),
  );
}
