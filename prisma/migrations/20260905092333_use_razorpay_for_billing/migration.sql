/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `Workspace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "razorpayCustomerId" TEXT,
ADD COLUMN     "razorpaySubscriptionId" TEXT;
