-- CreateTable
CREATE TABLE "AnalyticsReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "generatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "format" TEXT NOT NULL,
    "createdBy" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "AnalyticsReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsReport_generatedDate_idx" ON "AnalyticsReport"("generatedDate");

-- CreateIndex
CREATE INDEX "AnalyticsReport_reportType_idx" ON "AnalyticsReport"("reportType");

-- CreateIndex
CREATE INDEX "AnalyticsReport_createdBy_idx" ON "AnalyticsReport"("createdBy");
