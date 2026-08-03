CREATE TABLE "ServiceGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGroup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Services" ADD COLUMN "criticalFriction" TEXT;
ALTER TABLE "Services" ADD COLUMN "agentarumParadigm" TEXT;
ALTER TABLE "Services" ADD COLUMN "hardTangibleDeliverables" TEXT;
ALTER TABLE "Services" ADD COLUMN "serviceGroupId" TEXT;

ALTER TABLE "Product" ADD COLUMN "architectureBlueprint" TEXT;
ALTER TABLE "Product" ADD COLUMN "retailBanking" TEXT;
ALTER TABLE "Product" ADD COLUMN "capitalMarkets" TEXT;
ALTER TABLE "Product" ADD COLUMN "wealthAndAsset" TEXT;
ALTER TABLE "Product" ADD COLUMN "initiateAthenionDiscussion" TEXT;
ALTER TABLE "Product" ADD COLUMN "productGroupId" TEXT;

CREATE INDEX "ServiceGroup_name_idx" ON "ServiceGroup"("name");
CREATE INDEX "ProductGroup_name_idx" ON "ProductGroup"("name");
CREATE INDEX "Services_serviceGroupId_idx" ON "Services"("serviceGroupId");
CREATE INDEX "Product_productGroupId_idx" ON "Product"("productGroupId");

ALTER TABLE "Services" ADD CONSTRAINT "Services_serviceGroupId_fkey" FOREIGN KEY ("serviceGroupId") REFERENCES "ServiceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
