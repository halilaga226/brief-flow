import { prisma } from "@/lib/prisma"

/**
 * Prod may lag behind schema when `prisma migrate deploy` was not run.
 * Idempotent DDL matching `20261005130000_work_item_client_completed`.
 */
let ensurePromise: Promise<void> | null = null

export async function ensureWorkItemSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = applyWorkItemClientCompletedMigration().catch((error) => {
      ensurePromise = null
      throw error
    })
  }
  await ensurePromise
}

async function applyWorkItemClientCompletedMigration() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "WorkItem_clientId_idx" ON "WorkItem"("clientId");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "WorkItem_completedAt_idx" ON "WorkItem"("completedAt");
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "Client"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)
  // Do not touch `_prisma_migrations` here — build-time `migrate deploy`
  // records the real checksum; SQL is idempotent (IF NOT EXISTS).
}
