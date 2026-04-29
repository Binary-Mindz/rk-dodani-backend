/*
  Warnings:

  - You are about to drop the column `canonicalUrl` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `ogImageFileId` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `seoKeywords` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalUrl` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `ogImageFileId` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `seoKeywords` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_ogImageFileId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_ogImageFileId_fkey";

-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "canonicalUrl",
DROP COLUMN "ogImageFileId",
DROP COLUMN "seoDescription",
DROP COLUMN "seoKeywords",
DROP COLUMN "seoTitle";

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "canonicalUrl",
DROP COLUMN "ogImageFileId",
DROP COLUMN "seoDescription",
DROP COLUMN "seoKeywords",
DROP COLUMN "seoTitle";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "seoDescription",
DROP COLUMN "seoTitle";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "companyName",
DROP COLUMN "country",
DROP COLUMN "jobTitle",
DROP COLUMN "notes";
