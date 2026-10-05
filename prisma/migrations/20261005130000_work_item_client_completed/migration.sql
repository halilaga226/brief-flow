-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkItem_clientId_idx" ON "WorkItem"("clientId");
CREATE INDEX IF NOT EXISTS "WorkItem_completedAt_idx" ON "WorkItem"("completedAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
