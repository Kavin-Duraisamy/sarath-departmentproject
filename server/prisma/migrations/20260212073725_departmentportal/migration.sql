-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('INTERNSHIP', 'FINAL_YEAR', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "academic_records" ADD COLUMN     "arrears" INTEGER,
ADD COLUMN     "sgpa" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "duration" TEXT,
ADD COLUMN     "guideEmail" TEXT,
ADD COLUMN     "guideName" TEXT,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "technologies" TEXT,
ADD COLUMN     "type" "ProjectType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "fatherPhone" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "motherPhone" TEXT;
