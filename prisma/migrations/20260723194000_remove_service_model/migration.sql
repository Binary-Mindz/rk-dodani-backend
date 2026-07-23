-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Service_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Service_updatedById_fkey";

-- DropTable
DROP TABLE IF EXISTS "Service";

-- CreateTable
CREATE TABLE "Services" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeepPoint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "criticalFriction" TEXT,
    "paradigm" TEXT,
    "keyFeatures" TEXT[],
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "DeepPoint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeepPoint" ADD CONSTRAINT "DeepPoint_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
