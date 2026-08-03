-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "isAutoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "planTitle" TEXT;
