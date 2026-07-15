-- CreateEnum
CREATE TYPE "BannerMediaType" AS ENUM ('IMAGE', 'GIF', 'VIDEO');

-- CreateTable
CREATE TABLE "PromoBanner" (
    "id" TEXT NOT NULL,
    "mediaType" "BannerMediaType" NOT NULL,
    "mediaKey" TEXT,
    "streamId" TEXT,
    "posterKey" TEXT,
    "headline" TEXT,
    "linkUrl" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoBanner_active_startAt_endAt_idx" ON "PromoBanner"("active", "startAt", "endAt");

-- Golden Rule 15: every new table ships RLS-ENABLED (deny-all, no policies).
ALTER TABLE "PromoBanner" ENABLE ROW LEVEL SECURITY;
