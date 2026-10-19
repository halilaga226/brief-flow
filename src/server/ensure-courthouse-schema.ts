import { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"

let ensurePromise: Promise<void> | null = null

/** Prod may lag behind migrate deploy — create Courthouse tables if missing. */
export async function ensureCourthouseSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = applyCourthouseMigration().catch((error) => {
      ensurePromise = null
      throw error
    })
  }
  await ensurePromise
}

async function applyCourthouseMigration() {
  const directUrl = process.env.DIRECT_URL?.trim()
  const client =
    directUrl && directUrl !== process.env.DATABASE_URL
      ? new PrismaClient({ datasources: { db: { url: directUrl } } })
      : prisma
  const owned = client !== prisma

  try {
    const existing = await client.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('Courthouse', 'CourthouseJob')
    `
    const names = new Set(existing.map((row) => row.table_name))
    if (names.has("Courthouse") && names.has("CourthouseJob")) {
      return
    }

    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "CourthouseJobKind" AS ENUM ('GORUSME', 'IS');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Courthouse" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "city" TEXT NOT NULL DEFAULT '',
        "notes" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Courthouse_pkey" PRIMARY KEY ("id")
      )
    `)
    await client.$executeRawUnsafe(`
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
      )
    `)
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Courthouse_name_idx" ON "Courthouse"("name")`,
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "CourthouseJob_courthouseId_idx" ON "CourthouseJob"("courthouseId")`,
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "CourthouseJob_assigneeId_idx" ON "CourthouseJob"("assigneeId")`,
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "CourthouseJob_assignerId_idx" ON "CourthouseJob"("assignerId")`,
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "CourthouseJob_completedAt_idx" ON "CourthouseJob"("completedAt")`,
    )
    await client.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "CourthouseJob_dueDate_idx" ON "CourthouseJob"("dueDate")`,
    )
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_courthouseId_fkey"
          FOREIGN KEY ("courthouseId") REFERENCES "Courthouse"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_assignerId_fkey"
          FOREIGN KEY ("assignerId") REFERENCES "User"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_assigneeId_fkey"
          FOREIGN KEY ("assigneeId") REFERENCES "User"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "CourthouseJob" ADD CONSTRAINT "CourthouseJob_completedById_fkey"
          FOREIGN KEY ("completedById") REFERENCES "User"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
  } finally {
    if (owned) await client.$disconnect()
  }
}
