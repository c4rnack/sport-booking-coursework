-- CreateEnum
CREATE TYPE "PromotionTarget" AS ENUM ('ALL_SECTIONS', 'SPORT_TYPE', 'MEMBERSHIPS');

-- AlterEnum
ALTER TYPE "MembershipStatus" ADD VALUE 'USED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "promoDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "usedMembershipType" "MembershipType";

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "targetScope" "PromotionTarget" NOT NULL DEFAULT 'ALL_SECTIONS',
ADD COLUMN     "targetSportType" TEXT;
