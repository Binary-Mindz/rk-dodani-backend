/*
  Warnings:

  - You are about to drop the column `body` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the `Page` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_updatedById_fkey";

-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "body";

-- DropTable
DROP TABLE "Page";
