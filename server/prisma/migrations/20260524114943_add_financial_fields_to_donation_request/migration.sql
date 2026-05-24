-- AlterTable
ALTER TABLE "DonationRequest" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "financialAmount" DOUBLE PRECISION,
ADD COLUMN     "financialPurpose" TEXT;
