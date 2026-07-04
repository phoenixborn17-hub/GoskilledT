-- LC #32 (GPS-M4): give the account-holder name its own column and retire `bankNameEnc`.
-- Data-preserving + idempotent: add → backfill (copy existing ciphertext) → drop.
-- The old column held the encrypted account-holder name (not a bank name); we carry it over verbatim.

ALTER TABLE "Kyc" ADD COLUMN IF NOT EXISTS "accountHolderEnc" TEXT;

UPDATE "Kyc"
SET "accountHolderEnc" = "bankNameEnc"
WHERE "accountHolderEnc" IS NULL AND "bankNameEnc" IS NOT NULL;

ALTER TABLE "Kyc" DROP COLUMN IF EXISTS "bankNameEnc";
