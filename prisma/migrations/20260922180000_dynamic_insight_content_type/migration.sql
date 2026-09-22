-- AlterTable Insight: change contentType from enum to text and set default 'ARTICLE'
ALTER TABLE "Insight" ALTER COLUMN "contentType" TYPE TEXT USING "contentType"::TEXT;
ALTER TABLE "Insight" ALTER COLUMN "contentType" SET DEFAULT 'ARTICLE';
