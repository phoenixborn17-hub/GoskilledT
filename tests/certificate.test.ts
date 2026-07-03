import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  generateSerial,
  isEligibleForCertificate,
  issueCertificateIfEligible,
  getCertificateBySerial,
} from "@/lib/lms/certificate";
import { completeLesson } from "@/lib/lms/queries";

// runId prefix "LMS…" so purge-test-data catches these rows on the shared DB.
const HAS_DB = !!process.env.DATABASE_URL;
const runId = `lmscert${Date.now()}`;

describe("generateSerial (unit)", () => {
  it("formats as GS-XXXXX-XXXXX with an unambiguous alphabet", () => {
    const s = generateSerial(() => Buffer.from(Array(10).fill(0)));
    expect(s).toMatch(
      /^GS-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/,
    );
    // No ambiguous characters.
    expect(s).not.toMatch(/[01ILO]/);
  });

  it("varies with the random bytes (unguessable)", () => {
    const a = generateSerial(() => Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    const b = generateSerial(() => Buffer.from([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]));
    expect(a).not.toBe(b);
  });
});

describe.skipIf(!HAS_DB)("certificate issuance + verify (integration)", () => {
  let userId: string;
  let courseId: string;
  let lessonId: string;

  beforeAll(async () => {
    const course = await prisma.course.create({
      data: {
        slug: `cert-course-${runId}`,
        title: "Certificate Test Course",
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    courseId = course.id;
    const mod = await prisma.module.create({
      data: { courseId, title: "M1", order: 1 },
      select: { id: true },
    });
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: mod.id,
        title: "Only lesson",
        order: 1,
        isFreePreview: false,
        videoAssetId: `${runId}-v`,
        durationSec: 60,
      },
      select: { id: true },
    });
    lessonId = lesson.id;
    const user = await prisma.user.create({
      data: {
        phone: `+919${String(Date.now()).slice(-9)}`,
        referralCode: runId.toUpperCase(),
        name: "Asha Verma",
      },
      select: { id: true },
    });
    userId = user.id;
    await prisma.enrollment.create({ data: { userId, courseId } });
  });

  it("is not eligible before completion; no certificate issued", async () => {
    expect(await isEligibleForCertificate(userId, courseId)).toBe(false);
    expect(await issueCertificateIfEligible(userId, courseId)).toBeNull();
  });

  it("issues on 100% completion; is idempotent + immutable", async () => {
    await completeLesson(userId, lessonId); // → 100%
    expect(await isEligibleForCertificate(userId, courseId)).toBe(true);

    const first = await issueCertificateIfEligible(userId, courseId);
    expect(first?.serial).toMatch(/^GS-/);

    // Idempotent: same serial, never re-issued.
    const second = await issueCertificateIfEligible(userId, courseId);
    expect(second?.serial).toBe(first?.serial);
    const count = await prisma.certificate.count({
      where: { userId, courseId },
    });
    expect(count).toBe(1);
  });

  it("verifies by serial: valid → name/course/date only; unknown → invalid", async () => {
    const cert = await prisma.certificate.findUniqueOrThrow({
      where: { userId_courseId: { userId, courseId } },
      select: { serial: true },
    });
    const v = await getCertificateBySerial(cert.serial);
    expect(v.valid).toBe(true);
    expect(v.learnerName).toBe("Asha Verma");
    expect(v.courseTitle).toBe("Certificate Test Course");
    expect(v.issuedAt).toBeInstanceOf(Date);

    const bogus = await getCertificateBySerial("GS-ZZZZZ-ZZZZZ");
    expect(bogus.valid).toBe(false);
    expect(bogus.learnerName).toBeNull();
  });
});
