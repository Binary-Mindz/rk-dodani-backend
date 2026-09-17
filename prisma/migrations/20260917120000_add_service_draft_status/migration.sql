-- AlterTable Services
ALTER TABLE "Services" ADD COLUMN IF NOT EXISTS "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';
CREATE INDEX IF NOT EXISTS "Services_status_idx" ON "Services"("status");

-- AlterTable ServiceGroup
ALTER TABLE "ServiceGroup" ADD COLUMN IF NOT EXISTS "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';
CREATE INDEX IF NOT EXISTS "ServiceGroup_status_idx" ON "ServiceGroup"("status");
