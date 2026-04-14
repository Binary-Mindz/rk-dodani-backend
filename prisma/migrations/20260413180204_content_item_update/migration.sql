/*
  Warnings:

  - You are about to drop the column `coverImageFileId` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailFileId` on the `ContentItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "coverImageFileId",
DROP COLUMN "thumbnailFileId";
