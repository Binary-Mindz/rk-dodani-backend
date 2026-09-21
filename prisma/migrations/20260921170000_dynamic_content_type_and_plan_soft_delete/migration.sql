-- AlterTable ContentType: change code from enum to text
ALTER TABLE "ContentType" ALTER COLUMN "code" TYPE TEXT;

-- AlterTable Plan: add deletedAt column
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Plan_deletedAt_idx" ON "Plan"("deletedAt");
