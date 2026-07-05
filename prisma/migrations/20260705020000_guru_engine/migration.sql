-- GPS-M5 §2.0 Guru engine: Course Knowledge Base (corpus Guru answers from) + GuruMessage usage/cost log.
-- Golden Rule 15: BOTH new public tables ship with RLS ENABLED (deny-all; owner/Prisma bypasses,
-- PostgREST anon/authenticated denied). Idempotent guards so a re-run is safe.

-- Enums
DO $$ BEGIN
  CREATE TYPE "KnowledgeKind" AS ENUM ('TRANSCRIPT', 'NOTES', 'GLOSSARY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "GuruVerdict" AS ENUM ('ANSWERED', 'REDIRECTED', 'BLOCKED', 'CAPPED', 'EMPTY', 'ERROR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Course Knowledge Base — one row per (lesson, kind).
CREATE TABLE IF NOT EXISTS "LessonKnowledge" (
  "id"        TEXT NOT NULL,
  "lessonId"  TEXT NOT NULL,
  "kind"      "KnowledgeKind" NOT NULL DEFAULT 'TRANSCRIPT',
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LessonKnowledge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LessonKnowledge_lessonId_kind_key"
  ON "LessonKnowledge" ("lessonId", "kind");

DO $$ BEGIN
  ALTER TABLE "LessonKnowledge"
    ADD CONSTRAINT "LessonKnowledge_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Guru usage/cost log — per-turn accounting for caps + auditability.
CREATE TABLE IF NOT EXISTS "GuruMessage" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "courseId"         TEXT,
  "lessonId"         TEXT,
  "question"         TEXT NOT NULL,
  "answer"           TEXT NOT NULL,
  "verdict"          "GuruVerdict" NOT NULL,
  "citations"        JSONB,
  "promptTokens"     INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "costPaise"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GuruMessage_userId_createdAt_idx" ON "GuruMessage" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "GuruMessage_createdAt_idx" ON "GuruMessage" ("createdAt");

DO $$ BEGIN
  ALTER TABLE "GuruMessage"
    ADD CONSTRAINT "GuruMessage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Golden Rule 15: RLS ENABLED (deny-all) on both new tables.
ALTER TABLE "LessonKnowledge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuruMessage" ENABLE ROW LEVEL SECURITY;
