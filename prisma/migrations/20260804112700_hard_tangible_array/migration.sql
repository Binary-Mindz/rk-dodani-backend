/*
  Warnings:

  - The `hardTangibleDeliverables` column on the `Services` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PrimaryFocusArea" AS ENUM ('EXECUTIVE_COACHING_ECOSYSTEM', 'ENGINEERING_TO_WIN_WORKSHOPS', 'FRACTIONAL_CIO_CAIO');

-- CreateEnum
CREATE TYPE "TargetDeployTimeline" AS ENUM ('IMMEDIATE_PILOT_14_DAYS', 'QUARTERLY_PILOT_90_DAYS', 'CUSTOM_TIMELINE');

-- CreateEnum
CREATE TYPE "ProductSubmissionStatus" AS ENUM ('NEW', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceSubmissionStatus" AS ENUM ('NEW', 'REVIEWED', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductSector" ALTER COLUMN "keyFeatures" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Services" DROP COLUMN "hardTangibleDeliverables",
ADD COLUMN     "hardTangibleDeliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ServiceSubmission" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "corporateEmail" TEXT NOT NULL,
    "primaryFocusArea" "PrimaryFocusArea" NOT NULL,
    "message" TEXT,
    "status" "ServiceSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSubmission" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "corporateEmail" TEXT NOT NULL,
    "company" TEXT,
    "targetDeployTimeline" "TargetDeployTimeline" NOT NULL,
    "useCase" TEXT,
    "status" "ProductSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customNavLink" (
    "id" TEXT NOT NULL,
    "isIndustriesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isCapabilitiesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isProductsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isInsightsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isServicesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isCareersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customNavLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceSubmission_status_idx" ON "ServiceSubmission"("status");

-- CreateIndex
CREATE INDEX "ServiceSubmission_primaryFocusArea_idx" ON "ServiceSubmission"("primaryFocusArea");

-- CreateIndex
CREATE INDEX "ProductSubmission_status_idx" ON "ProductSubmission"("status");

-- CreateIndex
CREATE INDEX "ProductSubmission_targetDeployTimeline_idx" ON "ProductSubmission"("targetDeployTimeline");
