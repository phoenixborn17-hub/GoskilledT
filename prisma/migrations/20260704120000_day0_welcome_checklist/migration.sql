-- DR-030 Day-0 Experience (GPS-M2 delta): registration → first session.
-- Adds two nullable, additive columns to the existing "User" table. No new table is created,
-- so no ENABLE ROW LEVEL SECURITY is required here (RLS on "User" was set in 20260703015712).
--
--   welcomeSeenAt  — one-time /welcome moment. NULL = never seen; set on completion OR skip.
--   checklistState — Get-Started checklist persistence (dismissal + seen-item ledger for analytics).
--                    Derivable progress (Lesson 0, preview, invites) is computed from REAL data and
--                    is NEVER stored here (D-29 truthfulness). Shape validated by Zod in app code.

ALTER TABLE "public"."User" ADD COLUMN "welcomeSeenAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN "checklistState" JSONB;
