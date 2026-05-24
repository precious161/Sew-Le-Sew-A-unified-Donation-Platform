-- AddForeignKey
ALTER TABLE "AnalyticsReport" ADD CONSTRAINT "AnalyticsReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
