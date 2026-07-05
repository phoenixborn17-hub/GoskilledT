// Certificate issuance + verification engine (GPS-M2 §2.6). TIER A — server-only, anti-fake.
//   • Issued on 100% course completion (mandatory-assignments gate = GPS-M5, not yet built).
//   • IMMUTABLE once issued: one per (user, course); never re-issued or overwritten.
//   • Unguessable serials (crypto-random) → the public verify page can't be enumerated.
//   • Public verification exposes name + course + date ONLY (no other PII).
// The visual/PDF template is a FOUNDER asset; the verify OG image is a functional engine render.
import { randomBytes } from "node:crypto";
import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import { courseProgress } from "../../modules/lms/progress";
import { completedLessonIds } from "./queries";

const courseWithLessons = {
  modules: {
    orderBy: { order: "asc" as const },
    include: { lessons: { orderBy: { order: "asc" as const } } },
  },
};

// Crockford-ish base32 (no ambiguous 0/O/1/I/L) → readable + unguessable. 10 chars ≈ 49 bits.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateSerial(
  rand: (n: number) => Buffer = randomBytes,
): string {
  const bytes = rand(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `GS-${s.slice(0, 5)}-${s.slice(5)}`;
}

/**
 * Have all PUBLISHED mandatory quizzes in the course been passed by this user? (GPS-M5 §2.2.)
 * NON-REGRESSION GUARANTEE: a course with no published mandatory quizzes (i.e. every existing course
 * today) returns true — so `isEligibleForCertificate` keeps its exact prior outcome. The gate can only
 * ADD a requirement, never relax one, and it never touches already-issued certificates.
 */
export async function passedAllMandatoryQuizzes(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const mandatory = await prisma.quiz.findMany({
    where: {
      status: "PUBLISHED",
      isMandatory: true,
      lesson: { module: { courseId } },
    },
    select: { id: true },
  });
  if (mandatory.length === 0) return true; // no-op for existing courses (non-regression)

  const passed = await prisma.quizAttempt.findMany({
    where: {
      userId,
      passed: true,
      quizId: { in: mandatory.map((q) => q.id) },
    },
    select: { quizId: true },
    distinct: ["quizId"],
  });
  const passedIds = new Set(passed.map((a) => a.quizId));
  return mandatory.every((q) => passedIds.has(q.id));
}

/**
 * Eligible iff every lesson is complete AND every PUBLISHED mandatory quiz is passed (GPS-M5 §2.2
 * makes the "mandatory assignments" gate M2 promised real). Existing courses (no mandatory quizzes)
 * are unaffected. Issuance stays idempotent + immutable — the gate never revokes an issued cert.
 */
export async function isEligibleForCertificate(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: courseWithLessons,
  });
  if (!course) return false;
  const ordered = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  if (ordered.length === 0) return false;
  const done = await completedLessonIds(userId, courseId);
  if (courseProgress(ordered, done).percent !== 100) return false;
  return passedAllMandatoryQuizzes(userId, courseId);
}

export interface IssuedCertificate {
  serial: string;
}

/**
 * Issue the certificate for a (user, course) if eligible and not already issued. Idempotent and
 * immutable: an existing certificate is returned untouched; concurrent issuance is de-duped via the
 * unique (userId, courseId) constraint. Returns null when not eligible. Never overwrites.
 */
export async function issueCertificateIfEligible(
  userId: string,
  courseId: string,
): Promise<IssuedCertificate | null> {
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { serial: true },
  });
  if (existing) return existing; // immutable — never re-issue

  if (!(await isEligibleForCertificate(userId, courseId))) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const serial = generateSerial();
    try {
      const cert = await prisma.certificate.create({
        data: { userId, courseId, serial },
        select: { serial: true },
      });
      // Event-logged (§2.6). Serial is public; no user PII in the log.
      console.log(
        JSON.stringify({
          event: "certificate_issued",
          courseId,
          serial: cert.serial,
        }),
      );
      return cert;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const target = (e.meta?.target as string[] | undefined) ?? [];
        if (target.includes("serial")) continue; // serial collision → try another
        // Concurrent (userId, courseId) create won the race → return that one.
        const now = await prisma.certificate.findUnique({
          where: { userId_courseId: { userId, courseId } },
          select: { serial: true },
        });
        if (now) return now;
      }
      throw e;
    }
  }
  throw new Error("Could not allocate a unique certificate serial");
}

export interface CertificateVerification {
  valid: boolean;
  learnerName: string | null; // the ONLY PII exposed publicly (§2.6)
  courseTitle: string | null;
  issuedAt: Date | null;
}

/** Public verify lookup by serial. Callers rate-limit by IP; serials are unguessable (no enum). */
export async function getCertificateBySerial(
  serial: string,
): Promise<CertificateVerification> {
  const cert = await prisma.certificate.findUnique({
    where: { serial },
    select: {
      issuedAt: true,
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  if (!cert)
    return {
      valid: false,
      learnerName: null,
      courseTitle: null,
      issuedAt: null,
    };
  return {
    valid: true,
    learnerName: cert.user.name,
    courseTitle: cert.course.title,
    issuedAt: cert.issuedAt,
  };
}
