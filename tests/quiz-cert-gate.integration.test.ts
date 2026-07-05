// GPS-M5 §2.2 — certificate-gate NON-REGRESSION suite. The M2 certificate engine is sacred; this
// proves the mandatory-quiz gate only ADDS a requirement and never regresses the existing path:
//   • a course with NO quizzes still issues on 100% completion (unchanged);
//   • issuance stays idempotent + immutable, serial unchanged;
//   • a PUBLISHED + mandatory quiz gates issuance until passed; DRAFT / non-mandatory do NOT gate;
//   • adding a mandatory quiz AFTER a cert is issued NEVER revokes it (no retroactive revocation);
//   • unknown serials still verify as invalid (anti-enumeration behaviour intact).
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  isEligibleForCertificate,
  issueCertificateIfEligible,
  getCertificateBySerial,
} from "@/lib/lms/certificate";
import { submitQuizAttempt } from "@/lib/lms/quiz";
import { completeLesson } from "@/lib/lms/queries";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = `lmsquiz${Date.now()}`;

async function makeCourse(tag: string) {
  const course = await prisma.course.create({
    data: {
      slug: `quizgate-${tag}-${runId}`,
      title: `Quiz Gate ${tag}`,
      status: "PUBLISHED",
    },
    select: { id: true },
  });
  const mod = await prisma.module.create({
    data: { courseId: course.id, title: "M1", order: 1 },
    select: { id: true },
  });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: mod.id,
      title: "L1",
      order: 1,
      videoAssetId: `${runId}-${tag}`,
      durationSec: 60,
    },
    select: { id: true },
  });
  return { courseId: course.id, lessonId: lesson.id };
}
async function makeUser(tag: string) {
  const u = await prisma.user.create({
    data: {
      phone: `+919${String(Date.now()).slice(-8)}${tag.length}`.slice(0, 13),
      referralCode: `${runId}${tag}`.toUpperCase(),
      name: "Quiz Learner",
    },
    select: { id: true },
  });
  return u.id;
}

describe.skipIf(!HAS_DB)(
  "certificate mandatory-quiz gate (non-regression)",
  () => {
    it("NO quizzes: still eligible + issues on 100% completion; idempotent + immutable", async () => {
      const { courseId, lessonId } = await makeCourse("noquiz");
      const userId = await makeUser("A");
      await prisma.enrollment.create({ data: { userId, courseId } });
      await completeLesson(userId, lessonId);

      expect(await isEligibleForCertificate(userId, courseId)).toBe(true);
      const first = await issueCertificateIfEligible(userId, courseId);
      expect(first?.serial).toMatch(/^GS-/);
      const second = await issueCertificateIfEligible(userId, courseId);
      expect(second?.serial).toBe(first?.serial); // idempotent + immutable serial
      expect(
        await prisma.certificate.count({ where: { userId, courseId } }),
      ).toBe(1);
    });

    it("PUBLISHED mandatory quiz gates issuance until passed", async () => {
      const { courseId, lessonId } = await makeCourse("mand");
      const userId = await makeUser("B");
      await prisma.enrollment.create({ data: { userId, courseId } });
      await completeLesson(userId, lessonId);

      const quiz = await prisma.quiz.create({
        data: {
          lessonId,
          title: "Checkpoint",
          status: "PUBLISHED",
          isMandatory: true,
          passPercent: 100,
          questions: {
            create: [
              {
                prompt: "2+2?",
                options: ["3", "4"],
                correctIndex: 1,
                order: 0,
              },
            ],
          },
        },
        select: { id: true },
      });

      // Lessons done but quiz not passed → gated.
      expect(await isEligibleForCertificate(userId, courseId)).toBe(false);
      expect(await issueCertificateIfEligible(userId, courseId)).toBeNull();

      // A FAILING attempt does not open the gate.
      await submitQuizAttempt(userId, lessonId, [0]);
      expect(await isEligibleForCertificate(userId, courseId)).toBe(false);

      // Passing attempt → gate opens → cert issues (unlimited retries).
      const res = await submitQuizAttempt(userId, lessonId, [1]);
      expect(res.ok && res.graded.passed).toBe(true);
      expect(await isEligibleForCertificate(userId, courseId)).toBe(true);
      expect(
        (await issueCertificateIfEligible(userId, courseId))?.serial,
      ).toMatch(/^GS-/);
      // Both attempts recorded (retries allowed).
      expect(
        await prisma.quizAttempt.count({ where: { userId, quizId: quiz.id } }),
      ).toBe(2);
    });

    it("DRAFT or non-mandatory quizzes do NOT gate (only PUBLISHED + mandatory)", async () => {
      const { courseId, lessonId } = await makeCourse("draft");
      const userId = await makeUser("C");
      await prisma.enrollment.create({ data: { userId, courseId } });
      await completeLesson(userId, lessonId);
      // DRAFT mandatory → ignored.
      await prisma.quiz.create({
        data: {
          lessonId,
          title: "Draft",
          status: "DRAFT",
          isMandatory: true,
          questions: {
            create: [
              { prompt: "q", options: ["a", "b"], correctIndex: 0, order: 0 },
            ],
          },
        },
      });
      expect(await isEligibleForCertificate(userId, courseId)).toBe(true);
      // Flip to PUBLISHED but non-mandatory → still ignored.
      await prisma.quiz.update({
        where: { lessonId },
        data: { status: "PUBLISHED", isMandatory: false },
      });
      expect(await isEligibleForCertificate(userId, courseId)).toBe(true);
    });

    it("NO retroactive revocation: a cert issued before a mandatory quiz exists stays valid", async () => {
      const { courseId, lessonId } = await makeCourse("retro");
      const userId = await makeUser("D");
      await prisma.enrollment.create({ data: { userId, courseId } });
      await completeLesson(userId, lessonId);
      const issued = await issueCertificateIfEligible(userId, courseId);
      expect(issued?.serial).toMatch(/^GS-/);

      // Now add a PUBLISHED mandatory quiz the learner has NOT passed.
      await prisma.quiz.create({
        data: {
          lessonId,
          title: "Late",
          status: "PUBLISHED",
          isMandatory: true,
          questions: {
            create: [
              { prompt: "q", options: ["a", "b"], correctIndex: 1, order: 0 },
            ],
          },
        },
      });
      // The already-issued cert is immutable — re-issue returns the SAME serial, never revoked.
      const again = await issueCertificateIfEligible(userId, courseId);
      expect(again?.serial).toBe(issued?.serial);
      const v = await getCertificateBySerial(issued!.serial);
      expect(v.valid).toBe(true);
    });

    it("unknown serial verifies as invalid (anti-enumeration behaviour intact)", async () => {
      const v = await getCertificateBySerial("GS-ZZZZZ-ZZZZZ");
      expect(v.valid).toBe(false);
      expect(v.learnerName).toBeNull();
    });
  },
);
