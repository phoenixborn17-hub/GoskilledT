-- GPS-M5 §2.2 Quiz engine: Quiz / QuizQuestion / QuizAttempt. Admin-drafted → published; a PUBLISHED
-- + mandatory quiz extends the course certificate gate. Golden Rule 15: ALL THREE new tables ship
-- RLS-ENABLED (deny-all; owner/Prisma bypasses, PostgREST anon/authenticated denied). Idempotent.

DO $$ BEGIN
  CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Quiz" (
  "id"          TEXT NOT NULL,
  "lessonId"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "status"      "QuizStatus" NOT NULL DEFAULT 'DRAFT',
  "isMandatory" BOOLEAN NOT NULL DEFAULT false,
  "passPercent" INTEGER NOT NULL DEFAULT 70,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Quiz_lessonId_key" ON "Quiz" ("lessonId");
DO $$ BEGIN
  ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "QuizQuestion" (
  "id"           TEXT NOT NULL,
  "quizId"       TEXT NOT NULL,
  "prompt"       TEXT NOT NULL,
  "options"      JSONB NOT NULL,
  "correctIndex" INTEGER NOT NULL,
  "explanation"  TEXT,
  "order"        INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey"
    FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "QuizAttempt" (
  "id"        TEXT NOT NULL,
  "quizId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "score"     INTEGER NOT NULL,
  "total"     INTEGER NOT NULL,
  "passed"    BOOLEAN NOT NULL,
  "answers"   JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_quizId_idx" ON "QuizAttempt" ("userId", "quizId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_idx" ON "QuizAttempt" ("quizId");
DO $$ BEGIN
  ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey"
    FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Golden Rule 15: RLS ENABLED (deny-all) on all three new tables.
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;
