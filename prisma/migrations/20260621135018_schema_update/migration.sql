/*
  Warnings:

  - You are about to drop the column `allowDownload` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the `ContentAsset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContentAsset" DROP CONSTRAINT "ContentAsset_contentItemId_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_publishedById_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_updatedById_fkey";

-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "allowDownload",
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "isDownloadable" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "ContentAsset";
