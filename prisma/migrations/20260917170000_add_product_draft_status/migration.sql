-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';
CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");

-- Backfill existing active products to PUBLISHED
UPDATE "Product" SET "status" = 'PUBLISHED' WHERE "status" = 'DRAFT' AND "isActive" = true;
