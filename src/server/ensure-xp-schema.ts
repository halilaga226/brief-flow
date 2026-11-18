import { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"

let ensurePromise: Promise<void> | null = null

export async function ensureXpSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = applyXpMigration().catch((error) => {
      ensurePromise = null
      throw error
    })
  }
  await ensurePromise
}

async function applyXpMigration() {
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
        AND table_name IN ('TaskScore', 'InternQuest', 'InternQuestAnswer', 'InternBonus')
    `
    const names = new Set(existing.map((row) => row.table_name))
    const nullability = await client.$queryRaw<Array<{ is_nullable: string }>>`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Notification'
        AND column_name = 'taskId'
    `
    if (nullability[0]?.is_nullable === "NO") {
      await client.$executeRawUnsafe(
        `ALTER TABLE "Notification" ALTER COLUMN "taskId" DROP NOT NULL`,
      )
    }
    if (!names.has("TaskScore")) {
      await client.$executeRawUnsafe(`
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
        )
      `)
      await client.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "TaskScore_taskId_key" ON "TaskScore"("taskId")`,
      )
      await client.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "TaskScore_internId_idx" ON "TaskScore"("internId")`,
      )
    }

    if (!names.has("InternQuest")) {
      await client.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InternQuest" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "prompt" TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          "closedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "InternQuest_pkey" PRIMARY KEY ("id")
        )
      `)
      await client.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "InternQuest_createdById_idx" ON "InternQuest"("createdById")`,
      )
    }

    if (!names.has("InternQuestAnswer")) {
      await client.$executeRawUnsafe(`
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
        )
      `)
      await client.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "InternQuestAnswer_questId_internId_key" ON "InternQuestAnswer"("questId", "internId")`,
      )
    }

    if (!names.has("InternBonus")) {
      await client.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InternBonus" (
          "id" TEXT NOT NULL,
          "internId" TEXT NOT NULL,
          "lawyerId" TEXT NOT NULL,
          "points" INTEGER NOT NULL,
          "note" TEXT NOT NULL DEFAULT '',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "InternBonus_pkey" PRIMARY KEY ("id")
        )
      `)
      await client.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "InternBonus_internId_idx" ON "InternBonus"("internId")`,
      )
    }
  } finally {
    if (owned) await client.$disconnect()
  }
}
