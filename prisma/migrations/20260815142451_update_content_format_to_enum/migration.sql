/*
  Warnings:

  - The `contentFormat` column on the `ContentItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ContentFileFormat" AS ENUM ('PDF_DOCUMENT', 'EXCEL_SPREADSHEET', 'PPT_PRESENTATION', 'AUDIO_FILE', 'MP4_VIDEO', 'IMAGE_PNG', 'MERMAID');

-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "contentFormat",
ADD COLUMN     "contentFormat" "ContentFileFormat";
