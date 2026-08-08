-- AlterTable
ALTER TABLE "ProductSubmission" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "ServiceSubmission" ADD COLUMN     "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "ProductSubmission_productId_idx" ON "ProductSubmission"("productId");

-- CreateIndex
CREATE INDEX "ServiceSubmission_serviceId_idx" ON "ServiceSubmission"("serviceId");

-- AddForeignKey
ALTER TABLE "ServiceSubmission" ADD CONSTRAINT "ServiceSubmission_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSubmission" ADD CONSTRAINT "ProductSubmission_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
