-- CreateEnum
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'SENT_TO_LAWYER';

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "driveFolderId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "driveRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "driveConnectedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CaseFile" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "courtName" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseFile_pkey" PRIMARY KEY ("id")
);

-- AlterTable Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "caseFileId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Client_ownerId_name_key" ON "Client"("ownerId", "name");
CREATE INDEX IF NOT EXISTS "Client_ownerId_idx" ON "Client"("ownerId");
CREATE UNIQUE INDEX IF NOT EXISTS "CaseFile_clientId_fileNumber_key" ON "CaseFile"("clientId", "fileNumber");
CREATE INDEX IF NOT EXISTS "CaseFile_clientId_idx" ON "CaseFile"("clientId");
CREATE INDEX IF NOT EXISTS "CaseFile_fileNumber_idx" ON "CaseFile"("fileNumber");
CREATE INDEX IF NOT EXISTS "Task_caseFileId_idx" ON "Task"("caseFileId");

DO $$ BEGIN
  ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
