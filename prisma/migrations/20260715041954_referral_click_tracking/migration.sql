-- CreateTable
CREATE TABLE "ReferralClick" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferralClick_code_createdAt_idx" ON "ReferralClick"("code", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralClick_visitorId_code_createdAt_idx" ON "ReferralClick"("visitorId", "code", "createdAt");

-- Golden Rule 15: every new table ships RLS-ENABLED (deny-all, no policies). The app connects as
-- table owner and bypasses non-forced RLS; this only blocks the anon key from PostgREST exposure.
ALTER TABLE "ReferralClick" ENABLE ROW LEVEL SECURITY;
