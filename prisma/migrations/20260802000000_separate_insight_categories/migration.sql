CREATE TABLE "InsightCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightCategory_pkey" PRIMARY KEY ("id")
);

INSERT INTO "InsightCategory" ("id", "name", "slug", "description", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT c."id", c."name", c."slug", c."description", c."isActive", c."createdAt", c."updatedAt"
FROM "Category" c
INNER JOIN "InsightCategoryMap" icm ON icm."categoryId" = c."id";

CREATE UNIQUE INDEX "InsightCategory_slug_key" ON "InsightCategory"("slug");
CREATE INDEX "InsightCategory_isActive_idx" ON "InsightCategory"("isActive");
CREATE INDEX "InsightCategoryMap_categoryId_idx" ON "InsightCategoryMap"("categoryId");

ALTER TABLE "InsightCategoryMap" DROP CONSTRAINT "InsightCategoryMap_categoryId_fkey";

ALTER TABLE "InsightCategoryMap" ADD CONSTRAINT "InsightCategoryMap_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "InsightCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
