-- CreateEnum
CREATE TYPE "PlanAudience" AS ENUM ('B2C', 'B2B');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPerUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetAudience" "PlanAudience" NOT NULL DEFAULT 'B2C';

-- CreateIndex
CREATE INDEX "Plan_targetAudience_idx" ON "Plan"("targetAudience");
