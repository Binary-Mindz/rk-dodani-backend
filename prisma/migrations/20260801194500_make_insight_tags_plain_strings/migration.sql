ALTER TABLE "InsightTagMap" ADD COLUMN "tag" TEXT;

UPDATE "InsightTagMap" AS itm
SET "tag" = COALESCE(t."name", itm."tagId")
FROM "Tag" AS t
WHERE t."id" = itm."tagId";

UPDATE "InsightTagMap"
SET "tag" = "tagId"
WHERE "tag" IS NULL;

ALTER TABLE "InsightTagMap" ALTER COLUMN "tag" SET NOT NULL;

ALTER TABLE "InsightTagMap" DROP CONSTRAINT IF EXISTS "InsightTagMap_tagId_fkey";
DROP INDEX IF EXISTS "InsightTagMap_insightId_tagId_key";

ALTER TABLE "InsightTagMap" DROP COLUMN "tagId";

CREATE UNIQUE INDEX "InsightTagMap_insightId_tag_key" ON "InsightTagMap"("insightId", "tag");
CREATE INDEX "InsightTagMap_tag_idx" ON "InsightTagMap"("tag");
