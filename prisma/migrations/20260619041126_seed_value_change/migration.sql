/*
  Warnings:

  - The values [ADMIN,EDITOR,SUPPORT,USER,SUBSCRIBER] on the enum `UserRoleCode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRoleCode_new" AS ENUM ('SUPER_ADMIN', 'STUDENT', 'SOLO_PROF', 'SMB', 'ENTERPRISE');
ALTER TABLE "Role" ALTER COLUMN "code" TYPE "UserRoleCode_new" USING ("code"::text::"UserRoleCode_new");
ALTER TYPE "UserRoleCode" RENAME TO "UserRoleCode_old";
ALTER TYPE "UserRoleCode_new" RENAME TO "UserRoleCode";
DROP TYPE "public"."UserRoleCode_old";
COMMIT;
