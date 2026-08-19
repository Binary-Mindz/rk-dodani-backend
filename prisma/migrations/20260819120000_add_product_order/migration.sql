-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_order_idx" ON "Product"("order");
