/*
  Warnings:

  - You are about to drop the column `displayOrder` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Tag` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Category_displayOrder_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "displayOrder";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "color";
