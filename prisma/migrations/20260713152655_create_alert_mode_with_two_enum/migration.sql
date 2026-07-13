-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AlertMethod" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "alertMethod" "AlertMethod" NOT NULL DEFAULT 'PUSH',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
