-- Phase C (DR-037) — KYC expansion. ADDITIVE ONLY, idempotent. No drops, no data loss.
-- New Kyc fields: contact email + verify flags, bank name, doc type, encrypted doc-object paths.
-- New ContactVerification table backs the email/WhatsApp verify flow (RLS enabled, deny-all).

-- ── Kyc: additive columns (all nullable) ────────────────────────────────────────────────────
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "whatsappVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "docType" TEXT;
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "addressDocEnc" TEXT;
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "panDocEnc" TEXT;
ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "bankDocEnc" TEXT;

-- ── ContactVerification: new table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ContactVerification" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "channel"    TEXT NOT NULL,
    "target"     TEXT NOT NULL,
    "codeHash"   TEXT NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactVerification_userId_channel_idx"
    ON "ContactVerification"("userId", "channel");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ContactVerification_userId_fkey'
    ) THEN
        ALTER TABLE "ContactVerification"
            ADD CONSTRAINT "ContactVerification_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- RLS: every new public table ships RLS ENABLED, deny-all (no policies). The app connects as the
-- table owner and bypasses non-forced RLS; PostgREST/anon are denied. (CLAUDE.md golden rule 15.)
ALTER TABLE "ContactVerification" ENABLE ROW LEVEL SECURITY;
