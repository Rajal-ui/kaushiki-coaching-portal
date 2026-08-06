-- AlterTable: Add PIN verification fields to parent_student_links
ALTER TABLE "parent_student_links" ADD COLUMN "pin" TEXT NOT NULL DEFAULT '000000';
ALTER TABLE "parent_student_links" ADD COLUMN "pinVerified" BOOLEAN NOT NULL DEFAULT false;
