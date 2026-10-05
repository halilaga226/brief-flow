import { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Prod may lag behind schema when `prisma migrate deploy` was not run.
 * Idempotent DDL matching `20261005130000_work_item_client_completed`.
 * Prefer DIRECT_URL (session mode) for DDL; fall back to the pooled client.
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
  const directUrl = process.env.DIRECT_URL?.trim()
  const client =
    directUrl && directUrl !== process.env.DATABASE_URL
      ? new PrismaClient({ datasources: { db: { url: directUrl } } })
      : prisma
  const owned = client !== prisma

  try {
    // Skip DDL when columns already exist (fast path for healthy DBs).
    const existing = await client.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'WorkItem'
        AND column_name IN ('clientId', 'completedAt')
    `
    const names = new Set(existing.map((row) => row.column_name))
    if (names.has("clientId") && names.has("completedAt")) {
      return
    }

    await client.$executeRawUnsafe(
      `ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "clientId" TEXT`,
    )
    await client.$executeRawUnsafe(
      `ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3)`,
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "WorkItem_clientId_idx" ON "WorkItem"("clientId")`,
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "WorkItem_completedAt_idx" ON "WorkItem"("completedAt")`,
    )
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_clientId_fkey"
          FOREIGN KEY ("clientId") REFERENCES "Client"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
  } finally {
    if (owned) await client.$disconnect()
  }
}
