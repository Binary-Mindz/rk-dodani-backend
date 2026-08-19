-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_productGroupId_fkey";
ALTER TABLE "ProductSector" DROP CONSTRAINT IF EXISTS "ProductSector_productId_fkey";
ALTER TABLE "TargetClient" DROP CONSTRAINT IF EXISTS "TargetClient_productId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Product_productGroupId_idx";

-- AlterTable Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "scaleValueImpact";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "migrationVector";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "productImage";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "architectureBlueprint";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "initiateAthenionDiscussion";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "productGroupId";

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "scaleValueImpact" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "mitigationVector" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "platformCapabilitiesDescriptor" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "retailBanking" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "capitalMarkets" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "wealthAndAsset" JSONB;

-- DropTable
DROP TABLE IF EXISTS "ProductSector" CASCADE;
DROP TABLE IF EXISTS "TargetClient" CASCADE;
DROP TABLE IF EXISTS "ProductGroup" CASCADE;
