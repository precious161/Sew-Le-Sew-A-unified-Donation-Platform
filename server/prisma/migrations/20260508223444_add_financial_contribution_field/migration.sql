-- AlterTable
ALTER TABLE "FinancialContribution" ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AddForeignKey
ALTER TABLE "FinancialContribution" ADD CONSTRAINT "FinancialContribution_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
