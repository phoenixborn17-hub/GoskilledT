-- GPS-M5 §2.2 grandfather rule (Fable Tier-A condition 2): a mandatory quiz gates ONLY completions
-- at/after its publish moment. Additive nullable column; non-breaking. Backfill: any already-PUBLISHED
-- quiz gets publishedAt = updatedAt (best available proxy) so existing published quizzes keep gating.
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
UPDATE "Quiz" SET "publishedAt" = "updatedAt" WHERE "status" = 'PUBLISHED' AND "publishedAt" IS NULL;
