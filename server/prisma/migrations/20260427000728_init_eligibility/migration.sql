-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Blood', 'Organ', 'Financial', 'In_Kind');

-- CreateEnum
CREATE TYPE "RuleDataType" AS ENUM ('Number', 'Boolean', 'String');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('Eligible', 'Ineligible', 'NotChecked');

-- CreateTable
CREATE TABLE "MedicalStandard" (
    "id" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "dataType" "RuleDataType" NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "answers" JSONB NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEligibilityStatus" (
    "userId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "status" "EligibilityStatus" NOT NULL DEFAULT 'Ineligible',
    "ineligibleUntil" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEligibilityStatus_pkey" PRIMARY KEY ("userId","category")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalStandard_category_ruleKey_key" ON "MedicalStandard"("category", "ruleKey");

-- AddForeignKey
ALTER TABLE "EligibilityLog" ADD CONSTRAINT "EligibilityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEligibilityStatus" ADD CONSTRAINT "UserEligibilityStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
