-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'PendingVerification';
COMMIT;

-- DropIndex
DROP INDEX "DonationIntent_userId_category_status_key";

-- AlterTable
ALTER TABLE "DonationRequest" ADD COLUMN     "attendingDoctor" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "hospitalName" TEXT,
ADD COLUMN     "originalUrgency" "UrgencyLevel",
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PendingVerification';

-- AddForeignKey
ALTER TABLE "DonationRequest" ADD CONSTRAINT "DonationRequest_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
