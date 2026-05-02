-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('Pending', 'Verified', 'Allocated', 'Failed');

-- AlterTable
ALTER TABLE "DonationIntent" ADD COLUMN     "itemType" TEXT,
ADD COLUMN     "quantity" INTEGER;

-- AlterTable
ALTER TABLE "DonationRequest" ADD COLUMN     "itemQuantity" INTEGER,
ADD COLUMN     "itemType" TEXT;

-- CreateTable
CREATE TABLE "FinancialContribution" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "purpose" TEXT,
    "status" "FinancialStatus" NOT NULL DEFAULT 'Pending',
    "allocatedBy" TEXT,
    "allocatedAt" TIMESTAMP(3),
    "allocationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialContribution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FinancialContribution" ADD CONSTRAINT "FinancialContribution_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialContribution" ADD CONSTRAINT "FinancialContribution_allocatedBy_fkey" FOREIGN KEY ("allocatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
