-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('Unverified', 'Pending', 'Verified', 'Rejected');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identityDocumentUrl" TEXT,
ADD COLUMN     "identityRejectionReason" TEXT,
ADD COLUMN     "identityStatus" "IdentityStatus" NOT NULL DEFAULT 'Unverified',
ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "identityVerifiedBy" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_identityVerifiedBy_fkey" FOREIGN KEY ("identityVerifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
