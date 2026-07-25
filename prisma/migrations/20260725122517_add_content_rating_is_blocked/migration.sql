-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('RETAIL_BANKING', 'CAPITAL_MARKET', 'WEALTH_AND_ASSET');

-- AlterTable
ALTER TABLE "ContentRating" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subTitle" TEXT NOT NULL,
    "module" TEXT,
    "description" TEXT NOT NULL,
    "migrationVector" TEXT,
    "scaleValueImpact" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetClient" (
    "id" TEXT NOT NULL,
    "type" "TargetType" NOT NULL DEFAULT 'RETAIL_BANKING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "keyFeature" TEXT[],
    "productId" TEXT NOT NULL,

    CONSTRAINT "TargetClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TargetClient_productId_idx" ON "TargetClient"("productId");

-- AddForeignKey
ALTER TABLE "TargetClient" ADD CONSTRAINT "TargetClient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
