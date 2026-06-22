/*
  Warnings:

  - The values [ONE_TIME] on the enum `BillingInterval` will be removed. If these variants are still used in the database, this will fail.
  - The values [INTERNAL,ADMIN] on the enum `BillingProvider` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN_GRANT,PROMOTION,MANUAL] on the enum `EntitlementSourceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BillingInterval_new" AS ENUM ('MONTHLY', 'YEARLY');
ALTER TABLE "Plan" ALTER COLUMN "billingInterval" TYPE "BillingInterval_new" USING ("billingInterval"::text::"BillingInterval_new");
ALTER TYPE "BillingInterval" RENAME TO "BillingInterval_old";
ALTER TYPE "BillingInterval_new" RENAME TO "BillingInterval";
DROP TYPE "public"."BillingInterval_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BillingProvider_new" AS ENUM ('STRIPE', 'PATREON');
ALTER TABLE "public"."Plan" ALTER COLUMN "billingProvider" DROP DEFAULT;
ALTER TABLE "public"."Subscription" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "Plan" ALTER COLUMN "billingProvider" TYPE "BillingProvider_new" USING ("billingProvider"::text::"BillingProvider_new");
ALTER TABLE "Subscription" ALTER COLUMN "provider" TYPE "BillingProvider_new" USING ("provider"::text::"BillingProvider_new");
ALTER TABLE "SubscriptionEvent" ALTER COLUMN "provider" TYPE "BillingProvider_new" USING ("provider"::text::"BillingProvider_new");
ALTER TYPE "BillingProvider" RENAME TO "BillingProvider_old";
ALTER TYPE "BillingProvider_new" RENAME TO "BillingProvider";
DROP TYPE "public"."BillingProvider_old";
ALTER TABLE "Plan" ALTER COLUMN "billingProvider" SET DEFAULT 'STRIPE';
ALTER TABLE "Subscription" ALTER COLUMN "provider" SET DEFAULT 'STRIPE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EntitlementSourceType_new" AS ENUM ('SUBSCRIPTION', 'PATREON');
ALTER TABLE "Entitlement" ALTER COLUMN "sourceType" TYPE "EntitlementSourceType_new" USING ("sourceType"::text::"EntitlementSourceType_new");
ALTER TYPE "EntitlementSourceType" RENAME TO "EntitlementSourceType_old";
ALTER TYPE "EntitlementSourceType_new" RENAME TO "EntitlementSourceType";
DROP TYPE "public"."EntitlementSourceType_old";
COMMIT;
