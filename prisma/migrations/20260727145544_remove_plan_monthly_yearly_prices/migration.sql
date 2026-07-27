/*
  Warnings:

  - You are about to drop the column `priceAmountMonthly` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `priceAmountYearly` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceIdMonthly` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceIdYearly` on the `Plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "priceAmountMonthly",
DROP COLUMN "priceAmountYearly",
DROP COLUMN "stripePriceIdMonthly",
DROP COLUMN "stripePriceIdYearly";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "role" "UserRoleCode" NOT NULL DEFAULT 'STUDENT';
