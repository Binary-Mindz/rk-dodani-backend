-- CreateTable
CREATE TABLE "ContentBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentBookmark_userId_idx" ON "ContentBookmark"("userId");

-- CreateIndex
CREATE INDEX "ContentBookmark_contentItemId_idx" ON "ContentBookmark"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBookmark_userId_contentItemId_key" ON "ContentBookmark"("userId", "contentItemId");

-- AddForeignKey
ALTER TABLE "ContentBookmark" ADD CONSTRAINT "ContentBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBookmark" ADD CONSTRAINT "ContentBookmark_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
