-- AlterEnum
ALTER TYPE "TeamRole" ADD VALUE IF NOT EXISTS 'OWNER';

-- AlterTable Subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "poNumber" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'STRIPE';
CREATE INDEX IF NOT EXISTS "Subscription_poNumber_idx" ON "Subscription"("poNumber");

-- AlterTable CustomSubscriptionAssignment
ALTER TABLE "CustomSubscriptionAssignment" ADD COLUMN IF NOT EXISTS "isPo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CustomSubscriptionAssignment" ADD COLUMN IF NOT EXISTS "poNumber" TEXT;
ALTER TABLE "CustomSubscriptionAssignment" ALTER COLUMN "checkoutSessionId" DROP NOT NULL;
ALTER TABLE "CustomSubscriptionAssignment" ALTER COLUMN "checkoutUrl" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "CustomSubscriptionAssignment_poNumber_idx" ON "CustomSubscriptionAssignment"("poNumber");
