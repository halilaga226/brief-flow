-- AlterEnum
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'DELETED';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);

-- Backfill existing tasks as already accepted so live work is not blocked
UPDATE "Task" SET "acceptedAt" = "createdAt" WHERE "acceptedAt" IS NULL;
