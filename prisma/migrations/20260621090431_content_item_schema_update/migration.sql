/*
  Warnings:

  - You are about to drop the column `primaryAuthorId` on the `ContentItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_primaryAuthorId_fkey";

-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "primaryAuthorId";
