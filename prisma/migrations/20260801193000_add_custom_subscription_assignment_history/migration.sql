CREATE TYPE "CustomSubscriptionAssignmentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED', 'EXPIRED');

CREATE TABLE "CustomSubscriptionAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "planId" TEXT NOT NULL,
    "checkoutSessionId" TEXT NOT NULL,
    "checkoutUrl" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "status" "CustomSubscriptionAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomSubscriptionAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomSubscriptionAssignment_checkoutSessionId_key" ON "CustomSubscriptionAssignment"("checkoutSessionId");
CREATE INDEX "CustomSubscriptionAssignment_userId_idx" ON "CustomSubscriptionAssignment"("userId");
CREATE INDEX "CustomSubscriptionAssignment_assignedBy_idx" ON "CustomSubscriptionAssignment"("assignedBy");
CREATE INDEX "CustomSubscriptionAssignment_planId_idx" ON "CustomSubscriptionAssignment"("planId");
CREATE INDEX "CustomSubscriptionAssignment_status_idx" ON "CustomSubscriptionAssignment"("status");
CREATE INDEX "CustomSubscriptionAssignment_createdAt_idx" ON "CustomSubscriptionAssignment"("createdAt");

ALTER TABLE "CustomSubscriptionAssignment" ADD CONSTRAINT "CustomSubscriptionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomSubscriptionAssignment" ADD CONSTRAINT "CustomSubscriptionAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomSubscriptionAssignment" ADD CONSTRAINT "CustomSubscriptionAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
