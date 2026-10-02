-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "OfficeConfig" (
    "id" TEXT NOT NULL,
    "driveServiceAccountEnc" TEXT,
    "driveFolderId" TEXT,
    "driveServiceEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "OfficeConfig_pkey" PRIMARY KEY ("id")
);
