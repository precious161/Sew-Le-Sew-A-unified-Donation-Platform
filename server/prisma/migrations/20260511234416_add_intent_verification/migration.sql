-- AlterEnum
ALTER TYPE "IntentStatus" ADD VALUE 'PendingVerification';

-- AlterTable
ALTER TABLE "DonationIntent" ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AddForeignKey
ALTER TABLE "DonationIntent" ADD CONSTRAINT "DonationIntent_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
