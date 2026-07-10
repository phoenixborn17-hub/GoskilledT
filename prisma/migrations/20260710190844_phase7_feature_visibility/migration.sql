-- CreateEnum
CREATE TYPE "FeatureScope" AS ENUM ('GLOBAL', 'ROLE', 'USER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'REVIEWER';

-- CreateTable
CREATE TABLE "FeatureOverride" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "scope" "FeatureScope" NOT NULL,
    "scopeValue" TEXT NOT NULL DEFAULT '',
    "visible" BOOLEAN NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureOverride_featureKey_idx" ON "FeatureOverride"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureOverride_featureKey_scope_scopeValue_key" ON "FeatureOverride"("featureKey", "scope", "scopeValue");

-- RLS: every new public table ships RLS ENABLED, deny-all (no policies) — golden rule 15.
-- The app connects as table owner and bypasses non-forced RLS; the anon key gets nothing.
ALTER TABLE "FeatureOverride" ENABLE ROW LEVEL SECURITY;
