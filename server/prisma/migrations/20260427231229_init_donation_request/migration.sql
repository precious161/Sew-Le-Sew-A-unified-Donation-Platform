-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'Matching', 'Fulfilled', 'Cancelled');

-- CreateTable
CREATE TABLE "HealthInformation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "notes" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationRequest" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "donationType" "Category" NOT NULL,
    "requiredBloodType" TEXT,
    "organType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'Medium',
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthInformation_userId_key" ON "HealthInformation"("userId");

-- AddForeignKey
ALTER TABLE "HealthInformation" ADD CONSTRAINT "HealthInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationRequest" ADD CONSTRAINT "DonationRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
