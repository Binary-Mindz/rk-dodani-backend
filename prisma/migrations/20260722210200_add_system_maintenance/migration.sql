-- CreateTable
CREATE TABLE "SystemMaintenance" (
    "id" TEXT NOT NULL,
    "isUnderMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMaintenance_pkey" PRIMARY KEY ("id")
);
