-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InsightVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'GATED');

-- CreateEnum
CREATE TYPE "InsightContentType" AS ENUM ('ARTICLE', 'WHITE_PAPER', 'CASE_STUDY', 'REPORT', 'PODCAST', 'VIDEO', 'RESEARCH_NOTE', 'MEDIA_POST');

-- CreateEnum
CREATE TYPE "InsightFileType" AS ENUM ('PDF', 'WORD', 'EXCEL', 'POWERPOINT', 'IMAGE', 'VIDEO', 'AUDIO', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "IndustryTarget" AS ENUM ('BANKING', 'CAPITAL_MARKETS', 'WEALTH_MANAGEMENT', 'INSURANCE', 'FINTECH', 'HEALTHCARE', 'TECHNOLOGY', 'CONSULTING', 'EDUCATION', 'GOVERNMENT', 'OTHER');

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" TEXT,
    "summary" TEXT,
    "authorId" TEXT,
    "readingTimeMinutes" INTEGER,
    "coverImageUrl" TEXT,
    "externalUrl" TEXT,
    "status" "InsightStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "InsightVisibility" NOT NULL DEFAULT 'PUBLIC',
    "scheduledAt" TIMESTAMP(3),
    "allowComments" BOOLEAN NOT NULL DEFAULT false,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "contentType" "InsightContentType" NOT NULL DEFAULT 'ARTICLE',
    "fileType" "InsightFileType",
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightIndustryTarget" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "industry" "IndustryTarget" NOT NULL,

    CONSTRAINT "InsightIndustryTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightCategoryMap" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "InsightCategoryMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightTagMap" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "InsightTagMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Insight_slug_key" ON "Insight"("slug");

-- CreateIndex
CREATE INDEX "Insight_status_idx" ON "Insight"("status");

-- CreateIndex
CREATE INDEX "Insight_visibility_idx" ON "Insight"("visibility");

-- CreateIndex
CREATE INDEX "Insight_authorId_idx" ON "Insight"("authorId");

-- CreateIndex
CREATE INDEX "Insight_contentType_idx" ON "Insight"("contentType");

-- CreateIndex
CREATE INDEX "InsightIndustryTarget_insightId_idx" ON "InsightIndustryTarget"("insightId");

-- CreateIndex
CREATE UNIQUE INDEX "InsightIndustryTarget_insightId_industry_key" ON "InsightIndustryTarget"("insightId", "industry");

-- CreateIndex
CREATE UNIQUE INDEX "InsightCategoryMap_insightId_categoryId_key" ON "InsightCategoryMap"("insightId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "InsightTagMap_insightId_tagId_key" ON "InsightTagMap"("insightId", "tagId");

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightIndustryTarget" ADD CONSTRAINT "InsightIndustryTarget_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCategoryMap" ADD CONSTRAINT "InsightCategoryMap_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCategoryMap" ADD CONSTRAINT "InsightCategoryMap_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightTagMap" ADD CONSTRAINT "InsightTagMap_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightTagMap" ADD CONSTRAINT "InsightTagMap_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
