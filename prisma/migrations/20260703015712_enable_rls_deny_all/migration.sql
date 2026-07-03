-- SECURITY (Fable review, critical): Prisma-created public tables ship with RLS DISABLED,
-- so Supabase PostgREST exposed EVERY row to the anon/publishable key (PII, orders, ledger, KYC).
--
-- Fix: ENABLE ROW LEVEL SECURITY on all application tables with NO policies = deny-all for the
-- PostgREST roles (anon, authenticated). We intentionally do NOT use FORCE: the app connects as
-- the table OWNER (postgres, via DATABASE_URL/DIRECT_URL), and owners bypass non-forced RLS —
-- so Prisma keeps full access while PostgREST is denied.
--
-- NOTE for future migrations: any NEW table created later must also ENABLE ROW LEVEL SECURITY,
-- otherwise it is publicly exposed again. The DO block below re-asserts coverage across public.

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PackageCourse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Certificate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Affiliate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LedgerAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LedgerTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LedgerEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Withdrawal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Kyc" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Webinar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AdminAction" ENABLE ROW LEVEL SECURITY;

-- Belt-and-suspenders: enable RLS on ANY other table in the public schema (e.g. Prisma's own
-- _prisma_migrations) so nothing is left exposed. Owner still bypasses; PostgREST is denied.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.relname);
  END LOOP;
END $$;
