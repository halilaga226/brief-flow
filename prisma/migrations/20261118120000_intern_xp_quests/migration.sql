-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "taskId" DROP NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaskScore" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TaskScore_taskId_key" ON "TaskScore"("taskId");
CREATE INDEX IF NOT EXISTS "TaskScore_internId_idx" ON "TaskScore"("internId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "InternQuest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternQuest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InternQuest_createdById_idx" ON "InternQuest"("createdById");
CREATE INDEX IF NOT EXISTS "InternQuest_closedAt_idx" ON "InternQuest"("closedAt");

-- CreateTable
CREATE TABLE IF NOT EXISTS "InternQuestAnswer" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "points" INTEGER,
    "scoredById" TEXT,
    "scoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternQuestAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InternQuestAnswer_questId_internId_key" ON "InternQuestAnswer"("questId", "internId");
CREATE INDEX IF NOT EXISTS "InternQuestAnswer_internId_idx" ON "InternQuestAnswer"("internId");

DO $$ BEGIN
  ALTER TABLE "TaskScore" ADD CONSTRAINT "TaskScore_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TaskScore" ADD CONSTRAINT "TaskScore_internId_fkey"
    FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TaskScore" ADD CONSTRAINT "TaskScore_lawyerId_fkey"
    FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InternQuest" ADD CONSTRAINT "InternQuest_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InternQuestAnswer" ADD CONSTRAINT "InternQuestAnswer_questId_fkey"
    FOREIGN KEY ("questId") REFERENCES "InternQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InternQuestAnswer" ADD CONSTRAINT "InternQuestAnswer_internId_fkey"
    FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InternQuestAnswer" ADD CONSTRAINT "InternQuestAnswer_scoredById_fkey"
    FOREIGN KEY ("scoredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
