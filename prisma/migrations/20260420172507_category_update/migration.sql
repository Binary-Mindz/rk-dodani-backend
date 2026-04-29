/*
  Warnings:

  - You are about to drop the column `parentCategoryId` on the `Category` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentCategoryId_fkey";

-- DropIndex
DROP INDEX "Category_parentCategoryId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "parentCategoryId";

-- CreateIndex
CREATE INDEX "Category_displayOrder_idx" ON "Category"("displayOrder");
