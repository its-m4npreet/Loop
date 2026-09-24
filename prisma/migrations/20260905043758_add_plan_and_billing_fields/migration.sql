-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "askLoopUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "importsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "reportsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "usagePeriodStart" TIMESTAMP(3);
