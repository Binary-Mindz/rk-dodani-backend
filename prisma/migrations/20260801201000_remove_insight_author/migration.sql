ALTER TABLE "Insight" DROP CONSTRAINT IF EXISTS "Insight_authorId_fkey";
DROP INDEX IF EXISTS "Insight_authorId_idx";
ALTER TABLE "Insight" DROP COLUMN IF EXISTS "authorId";
