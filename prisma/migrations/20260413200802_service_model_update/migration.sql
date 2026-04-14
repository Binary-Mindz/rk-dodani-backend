/*
  Warnings:

  - You are about to drop the column `coverImageFileId` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `iconFileId` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "coverImageFileId",
DROP COLUMN "iconFileId";
