/*
  Warnings:

  - You are about to drop the `AppSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuthProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContactInquiry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentAccessRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmailLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Entitlement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InquiryActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PatreonConnection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOtp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `file_instances` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AppSetting" DROP CONSTRAINT "AppSetting_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "AuthProvider" DROP CONSTRAINT "AuthProvider_userId_fkey";

-- DropForeignKey
ALTER TABLE "ContactInquiry" DROP CONSTRAINT "ContactInquiry_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "ContactInquiry" DROP CONSTRAINT "ContactInquiry_relatedUserId_fkey";

-- DropForeignKey
ALTER TABLE "ContentAccessRule" DROP CONSTRAINT "ContentAccessRule_contentItemId_fkey";

-- DropForeignKey
ALTER TABLE "ContentAsset" DROP CONSTRAINT "ContentAsset_contentItemId_fkey";

-- DropForeignKey
ALTER TABLE "ContentCategory" DROP CONSTRAINT "ContentCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ContentCategory" DROP CONSTRAINT "ContentCategory_contentItemId_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_contentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_primaryAuthorId_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_publishedById_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "ContentTag" DROP CONSTRAINT "ContentTag_contentItemId_fkey";

-- DropForeignKey
ALTER TABLE "ContentTag" DROP CONSTRAINT "ContentTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_recipientUserId_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_contentItemId_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_grantedById_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_planId_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_revokedById_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_userId_fkey";

-- DropForeignKey
ALTER TABLE "InquiryActivity" DROP CONSTRAINT "InquiryActivity_inquiryId_fkey";

-- DropForeignKey
ALTER TABLE "InquiryActivity" DROP CONSTRAINT "InquiryActivity_performedById_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "PatreonConnection" DROP CONSTRAINT "PatreonConnection_userId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionEvent" DROP CONSTRAINT "SubscriptionEvent_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionEvent" DROP CONSTRAINT "SubscriptionEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserOtp" DROP CONSTRAINT "UserOtp_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropTable
DROP TABLE "AppSetting";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "AuthProvider";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "ContactInquiry";

-- DropTable
DROP TABLE "ContentAccessRule";

-- DropTable
DROP TABLE "ContentAsset";

-- DropTable
DROP TABLE "ContentCategory";

-- DropTable
DROP TABLE "ContentItem";

-- DropTable
DROP TABLE "ContentTag";

-- DropTable
DROP TABLE "ContentType";

-- DropTable
DROP TABLE "EmailLog";

-- DropTable
DROP TABLE "Entitlement";

-- DropTable
DROP TABLE "InquiryActivity";

-- DropTable
DROP TABLE "PasswordResetToken";

-- DropTable
DROP TABLE "PatreonConnection";

-- DropTable
DROP TABLE "Plan";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "Subscription";

-- DropTable
DROP TABLE "SubscriptionEvent";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserOtp";

-- DropTable
DROP TABLE "UserRole";

-- DropTable
DROP TABLE "UserSession";

-- DropTable
DROP TABLE "WebhookLog";

-- DropTable
DROP TABLE "file_instances";

-- DropEnum
DROP TYPE "AccessRuleOperator";

-- DropEnum
DROP TYPE "AccessRuleType";

-- DropEnum
DROP TYPE "AuditAction";

-- DropEnum
DROP TYPE "AuthProviderType";

-- DropEnum
DROP TYPE "BillingInterval";

-- DropEnum
DROP TYPE "BillingProvider";

-- DropEnum
DROP TYPE "ContentAccessModel";

-- DropEnum
DROP TYPE "ContentAssetRole";

-- DropEnum
DROP TYPE "ContentTypeCode";

-- DropEnum
DROP TYPE "ContentVisibility";

-- DropEnum
DROP TYPE "EmailDeliveryStatus";

-- DropEnum
DROP TYPE "EntitlementSourceType";

-- DropEnum
DROP TYPE "EntitlementStatus";

-- DropEnum
DROP TYPE "EntitlementType";

-- DropEnum
DROP TYPE "FileType";

-- DropEnum
DROP TYPE "InquiryActivityType";

-- DropEnum
DROP TYPE "InquiryPriority";

-- DropEnum
DROP TYPE "InquiryStatus";

-- DropEnum
DROP TYPE "InquiryType";

-- DropEnum
DROP TYPE "OtpPurpose";

-- DropEnum
DROP TYPE "PageType";

-- DropEnum
DROP TYPE "PlanAudience";

-- DropEnum
DROP TYPE "PublishStatus";

-- DropEnum
DROP TYPE "StoredFileAccessLevel";

-- DropEnum
DROP TYPE "StoredFileKind";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "UserRoleCode";

-- DropEnum
DROP TYPE "UserStatus";

-- DropEnum
DROP TYPE "WebhookProcessingStatus";

-- DropEnum
DROP TYPE "WebhookProvider";
