-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Backfill usernames from email local-part or id
UPDATE "User"
SET "username" = LOWER(
  REGEXP_REPLACE(
    COALESCE(
      NULLIF(SPLIT_PART(COALESCE("email", ''), '@', 1), ''),
      REPLACE("id", 'user_', 'u')
    ),
    '[^a-z0-9._-]',
    '',
    'g'
  )
)
WHERE "username" IS NULL OR "username" = '';

-- Ensure uniqueness collisions get a suffix
WITH ranked AS (
  SELECT id, username,
    ROW_NUMBER() OVER (PARTITION BY username ORDER BY "createdAt") AS rn
  FROM "User"
)
UPDATE "User" u
SET username = ranked.username || ranked.rn::text
FROM ranked
WHERE u.id = ranked.id AND ranked.rn > 1;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Email becomes optional
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
