-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('Active', 'Matched', 'Completed', 'Cancelled');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bloodType" TEXT;

-- CreateTable
CREATE TABLE "DonationIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Red Cross Center, Addis Ababa',
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "status" "IntentStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationIntent_userId_category_status_key" ON "DonationIntent"("userId", "category", "status");

-- AddForeignKey
ALTER TABLE "DonationIntent" ADD CONSTRAINT "DonationIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
