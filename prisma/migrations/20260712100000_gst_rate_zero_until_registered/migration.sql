-- M-2 (Wave-2 Tier-A): the LLP is NOT GST-registered, so no order may book a GST component.
-- Flip the Package.gstRateBps default to 0 and zero the existing packages so every new
-- Order persists gstInPaise = 0 (gstFromInclusive rate-0 path is already tested).
-- The column is KEPT for future use once registration is confirmed (founder decision).
ALTER TABLE "Package" ALTER COLUMN "gstRateBps" SET DEFAULT 0;

UPDATE "Package" SET "gstRateBps" = 0;

-- FV-1 (Wave-2 Tier-A): the `earn` feature is now fail-CLOSED by default in the registry.
-- Launch shows it via an EXPLICIT GLOBAL SHOW override (intentional act, not a fail-open default).
-- Idempotent on the (featureKey, scope, scopeValue) unique index. Remove this row to re-close the gate.
INSERT INTO "FeatureOverride" ("id", "featureKey", "scope", "scopeValue", "visible", "updatedAt")
VALUES ('fv_earn_global_show', 'earn', 'GLOBAL', '', true, CURRENT_TIMESTAMP)
ON CONFLICT ("featureKey", "scope", "scopeValue") DO UPDATE SET "visible" = true;
