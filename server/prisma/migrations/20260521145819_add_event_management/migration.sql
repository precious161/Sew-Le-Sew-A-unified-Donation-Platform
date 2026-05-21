-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Active', 'Cancelled', 'Completed');

-- CreateTable
CREATE TABLE "DonationEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'Active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DonationEvent" ADD CONSTRAINT "DonationEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
