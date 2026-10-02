-- AlterTable
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "nameKey" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Client_nameKey_idx" ON "Client"("nameKey");

-- CreateTable
CREATE TABLE IF NOT EXISTS "ImportFingerprint" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "clientId" TEXT,
    "meta" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportFingerprint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ImportFingerprint_kind_externalKey_key"
  ON "ImportFingerprint"("kind", "externalKey");

CREATE INDEX IF NOT EXISTS "ImportFingerprint_kind_idx" ON "ImportFingerprint"("kind");
