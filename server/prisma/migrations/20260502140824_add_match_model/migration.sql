-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('Pending', 'Notified', 'Accepted', 'Declined', 'Completed', 'Cancelled');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'Pending',
    "notifiedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_requestId_status_key" ON "Match"("requestId", "status");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "DonationIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DonationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
