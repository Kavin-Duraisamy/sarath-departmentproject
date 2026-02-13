-- AlterTable
ALTER TABLE "students" ADD COLUMN     "isAlumni" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passedOutYear" INTEGER;

-- CreateTable
CREATE TABLE "batch_progressions" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "promotedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedCount" INTEGER NOT NULL,
    "graduatedCount" INTEGER NOT NULL,
    "description" TEXT,
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_progressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "students_isAlumni_idx" ON "students"("isAlumni");
