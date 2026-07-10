-- Phase D — Rewards/Tiers + My-Leads. ADDITIVE ONLY, idempotent. Two new tables, both RLS-enabled.

-- ── RewardDefinition (admin-configurable reward targets) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "RewardDefinition" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "metric"      TEXT NOT NULL DEFAULT 'completed_referrals',
    "target"      INTEGER NOT NULL,
    "lastDate"    TIMESTAMP(3),
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RewardDefinition_pkey" PRIMARY KEY ("id")
);

-- ── AffiliateLead (affiliate-uploaded leads; phone/email encrypted) ─────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AffiliateLeadStatus') THEN
        CREATE TYPE "AffiliateLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'LOST');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AffiliateLead" (
    "id"        TEXT NOT NULL,
    "ownerId"   TEXT NOT NULL,
    "name"      TEXT,
    "phoneEnc"  TEXT NOT NULL,
    "emailEnc"  TEXT,
    "note"      TEXT,
    "status"    "AffiliateLeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AffiliateLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AffiliateLead_ownerId_createdAt_idx"
    ON "AffiliateLead"("ownerId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateLead_ownerId_fkey') THEN
        ALTER TABLE "AffiliateLead"
            ADD CONSTRAINT "AffiliateLead_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- RLS: every new public table ships RLS ENABLED, deny-all (no policies) — golden rule 15.
ALTER TABLE "RewardDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateLead" ENABLE ROW LEVEL SECURITY;
