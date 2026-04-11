-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "UserOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "otpCodeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserOtp_userId_idx" ON "UserOtp"("userId");

-- CreateIndex
CREATE INDEX "UserOtp_expiresAt_idx" ON "UserOtp"("expiresAt");

-- AddForeignKey
ALTER TABLE "UserOtp" ADD CONSTRAINT "UserOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
