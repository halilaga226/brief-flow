-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CourthouseJobKind" AS ENUM ('GORUSME', 'IS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Courthouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Courthouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CourthouseJob" (
    "id" TEXT NOT NULL,
    "courthouseId" TEXT NOT NULL,
    "kind" "CourthouseJobKind" NOT NULL DEFAULT 'IS',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "clientName" TEXT NOT NULL DEFAULT '',
    "fileNumber" TEXT NOT NULL DEFAULT '',
    "dueDate" TIMESTAMP(3),
    "assignerId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourthouseJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Courthouse_name_idx" ON "Courthouse"("name");
CREATE INDEX IF NOT EXISTS "CourthouseJob_courthouseId_idx" ON "CourthouseJob"("courthouseId");
CREATE INDEX IF NOT EXISTS "CourthouseJob_assigneeId_idx" ON "CourthouseJob"("assigneeId");
CREATE INDEX IF NOT EXISTS "CourthouseJob_assignerId_idx" ON "CourthouseJob"("assignerId");
CREATE INDEX IF NOT EXISTS "CourthouseJob_completedAt_idx" ON "CourthouseJob"("completedAt");
CREATE INDEX IF NOT EXISTS "CourthouseJob_dueDate_idx" ON "CourthouseJob"("dueDate");

DO $$ BEGIN
  ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_courthouseId_fkey"
    FOREIGN KEY ("courthouseId") REFERENCES "Courthouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_assignerId_fkey"
    FOREIGN KEY ("assignerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_completedById_fkey"
    FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
