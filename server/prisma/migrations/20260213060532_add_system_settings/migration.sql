/*
  Warnings:

  - You are about to drop the column `breakSlots` on the `timetable_settings` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `timetable_settings` table. All the data in the column will be lost.
  - You are about to drop the column `slotDuration` on the `timetable_settings` table. All the data in the column will be lost.
  - You are about to drop the column `timeSlot` on the `timetables` table. All the data in the column will be lost.
  - Added the required column `breakAfterPeriod` to the `timetable_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `breakDuration` to the `timetable_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodDuration` to the `timetable_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodsPerDay` to the `timetable_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodIndex` to the `timetables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PLACEMENT';
ALTER TYPE "NotificationType" ADD VALUE 'ACADEMIC';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT';
ALTER TYPE "NotificationType" ADD VALUE 'ANNOUNCEMENT';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "senderId" TEXT,
ADD COLUMN     "targetAudience" TEXT;

-- AlterTable
ALTER TABLE "timetable_settings" DROP COLUMN "breakSlots",
DROP COLUMN "endTime",
DROP COLUMN "slotDuration",
ADD COLUMN     "breakAfterPeriod" INTEGER NOT NULL,
ADD COLUMN     "breakDuration" INTEGER NOT NULL,
ADD COLUMN     "periodDuration" INTEGER NOT NULL,
ADD COLUMN     "periodsPerDay" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "timetables" DROP COLUMN "timeSlot",
ADD COLUMN     "facultyId" TEXT,
ADD COLUMN     "periodIndex" INTEGER NOT NULL,
ALTER COLUMN "facultyName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "instituteName" TEXT NOT NULL DEFAULT 'Department of Computer Science',
    "academicYear" TEXT NOT NULL DEFAULT '2024-2025',
    "semester" TEXT NOT NULL DEFAULT 'Odd',
    "minCGPA" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableProjectSimilarity" BOOLEAN NOT NULL DEFAULT true,
    "similarityThreshold" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_senderId_idx" ON "notifications"("senderId");

-- CreateIndex
CREATE INDEX "timetables_facultyId_idx" ON "timetables"("facultyId");

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
