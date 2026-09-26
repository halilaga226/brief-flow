-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkItem" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "opposingParty" TEXT NOT NULL,
    "courtName" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "workToDo" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkItem_ownerId_idx" ON "WorkItem"("ownerId");

DO $$ BEGIN
  ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "workItemId" TEXT;

CREATE INDEX IF NOT EXISTS "Task_workItemId_idx" ON "Task"("workItemId");

DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_workItemId_fkey"
    FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
