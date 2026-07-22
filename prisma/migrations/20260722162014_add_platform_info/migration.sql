-- CreateTable
CREATE TABLE "PlatformInfo" (
    "id" TEXT NOT NULL,
    "platformName" TEXT NOT NULL DEFAULT 'AgentArum',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@agentarum.io',
    "timezone" TEXT NOT NULL DEFAULT 'UTC+0 London',
    "language" TEXT NOT NULL DEFAULT 'English',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformInfo_pkey" PRIMARY KEY ("id")
);
