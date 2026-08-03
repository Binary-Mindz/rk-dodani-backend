ALTER TABLE "Insight" ADD COLUMN "industryTargets" "IndustryTarget"[] NOT NULL DEFAULT ARRAY[]::"IndustryTarget"[];
ALTER TABLE "Insight" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Insight" AS i
SET "industryTargets" = data."industryTargets"
FROM (
    SELECT "insightId", ARRAY_AGG(DISTINCT "industry") AS "industryTargets"
    FROM "InsightIndustryTarget"
    GROUP BY "insightId"
) AS data
WHERE data."insightId" = i."id";

UPDATE "Insight" AS i
SET "tags" = data."tags"
FROM (
    SELECT "insightId", ARRAY_AGG(DISTINCT "tag") AS "tags"
    FROM "InsightTagMap"
    GROUP BY "insightId"
) AS data
WHERE data."insightId" = i."id";

DROP TABLE "InsightIndustryTarget";
DROP TABLE "InsightTagMap";
