-- CreateEnum
CREATE TYPE "ProductSectorType" AS ENUM ('RETAIL_BANKING', 'CAPITAL_MARKETS', 'WEALTH_AND_ASSET');

-- AlterTable: remove old string columns (data loss acceptable per requirement)
ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "retailBanking",
  DROP COLUMN IF EXISTS "capitalMarkets",
  DROP COLUMN IF EXISTS "wealthAndAsset",
  DROP COLUMN IF EXISTS "role",
  DROP COLUMN IF EXISTS "module";

-- Add productImage
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "productImage" TEXT;

-- Add timestamps if not exist
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ProductSector" (
  "id"          TEXT NOT NULL,
  "productId"   TEXT NOT NULL,
  "sectorType"  "ProductSectorType" NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "keyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductSector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSector_productId_sectorType_key" ON "ProductSector"("productId", "sectorType");
CREATE INDEX "ProductSector_productId_idx" ON "ProductSector"("productId");

-- AddForeignKey
ALTER TABLE "ProductSector" ADD CONSTRAINT "ProductSector_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
