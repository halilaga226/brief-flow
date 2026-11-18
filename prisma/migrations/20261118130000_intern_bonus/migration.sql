CREATE TABLE IF NOT EXISTS "InternBonus" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternBonus_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InternBonus_internId_idx" ON "InternBonus"("internId");

DO $$ BEGIN
  ALTER TABLE "InternBonus" ADD CONSTRAINT "InternBonus_internId_fkey"
    FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InternBonus" ADD CONSTRAINT "InternBonus_lawyerId_fkey"
    FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
