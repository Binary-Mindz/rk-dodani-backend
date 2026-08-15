-- AlterTable
ALTER TABLE "ProductGroup" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ServiceGroup" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
