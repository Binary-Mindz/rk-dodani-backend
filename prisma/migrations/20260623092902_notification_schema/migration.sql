-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM_ALERT', 'COURSE_COMPLETED', 'ACHIEVEMENT_UNLOCKED', 'MENTION', 'ASSIGNMENT_DUE', 'CERTIFICATE_READY', 'NEW_COURSE_ADDED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEB', 'IOS', 'ANDROID');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM_ALERT',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'WEB',
    "deviceName" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allowPush" BOOLEAN NOT NULL DEFAULT true,
    "allowEmail" BOOLEAN NOT NULL DEFAULT true,
    "allowSms" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationToken_deviceToken_key" ON "NotificationToken"("deviceToken");

-- CreateIndex
CREATE INDEX "NotificationToken_userId_idx" ON "NotificationToken"("userId");

-- CreateIndex
CREATE INDEX "NotificationToken_isActive_idx" ON "NotificationToken"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationToken" ADD CONSTRAINT "NotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
