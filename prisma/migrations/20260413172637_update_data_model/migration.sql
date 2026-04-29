/*
  Warnings:

  - You are about to drop the column `storedFileId` on the `ContentAsset` table. All the data in the column will be lost.
  - You are about to drop the column `avatarFileId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `StoredFile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fileUrl` to the `ContentAsset` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'DOCS', 'LINK', 'DOCUMENT', 'ANY', 'VIDEO', 'AUDIO');

-- DropForeignKey
ALTER TABLE "ContentAsset" DROP CONSTRAINT "ContentAsset_storedFileId_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_coverImageFileId_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_thumbnailFileId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_heroImageFileId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_coverImageFileId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_iconFileId_fkey";

-- DropForeignKey
ALTER TABLE "StoredFile" DROP CONSTRAINT "StoredFile_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_avatarFileId_fkey";

-- DropIndex
DROP INDEX "ContentAsset_storedFileId_idx";

-- AlterTable
ALTER TABLE "ContentAsset" DROP COLUMN "storedFileId",
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileUrl" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER;

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "heroImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "iconUrl" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarFileId",
ADD COLUMN     "avatarUrl" TEXT;

-- DropTable
DROP TABLE "StoredFile";

-- CreateTable
CREATE TABLE "file_instances" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL DEFAULT 'ANY',
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_instances_pkey" PRIMARY KEY ("id")
);
