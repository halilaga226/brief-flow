-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "listColor" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");
