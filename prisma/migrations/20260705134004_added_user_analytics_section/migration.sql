-- CreateEnum
CREATE TYPE "ContentProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ActivityActionType" AS ENUM ('VIEWED', 'WATCHED', 'DOWNLOADED', 'LIKED', 'SHARED');

-- CreateTable
CREATE TABLE "UserContentProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "status" "ContentProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTimeSpentSec" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserContentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "actionType" "ActivityActionType" NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserContentProgress_userId_idx" ON "UserContentProgress"("userId");

-- CreateIndex
CREATE INDEX "UserContentProgress_contentItemId_idx" ON "UserContentProgress"("contentItemId");

-- CreateIndex
CREATE INDEX "UserContentProgress_status_idx" ON "UserContentProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserContentProgress_userId_contentItemId_key" ON "UserContentProgress"("userId", "contentItemId");

-- CreateIndex
CREATE INDEX "UserActivityLog_userId_idx" ON "UserActivityLog"("userId");

-- CreateIndex
CREATE INDEX "UserActivityLog_contentItemId_idx" ON "UserActivityLog"("contentItemId");

-- CreateIndex
CREATE INDEX "UserActivityLog_actionType_idx" ON "UserActivityLog"("actionType");

-- CreateIndex
CREATE INDEX "UserActivityLog_createdAt_idx" ON "UserActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserContentProgress" ADD CONSTRAINT "UserContentProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentProgress" ADD CONSTRAINT "UserContentProgress_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
