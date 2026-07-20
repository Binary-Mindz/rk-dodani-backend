ALTER TABLE "ConversationMember"
ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockedById" TEXT,
ADD COLUMN "blockReason" TEXT;
