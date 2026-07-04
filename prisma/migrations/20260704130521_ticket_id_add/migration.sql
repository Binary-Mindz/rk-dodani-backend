/*
  Warnings:

  - Added the required column `ticketId` to the `ContactInquiry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContactInquiry" ADD COLUMN     "ticketId" TEXT NOT NULL;
