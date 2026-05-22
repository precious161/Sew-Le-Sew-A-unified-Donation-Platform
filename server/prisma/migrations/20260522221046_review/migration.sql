-- CreateIndex
CREATE INDEX "DonationEvent_eventDate_idx" ON "DonationEvent"("eventDate");

-- CreateIndex
CREATE INDEX "DonationEvent_status_idx" ON "DonationEvent"("status");

-- CreateIndex
CREATE INDEX "DonationRequest_status_idx" ON "DonationRequest"("status");

-- CreateIndex
CREATE INDEX "DonationRequest_donationType_idx" ON "DonationRequest"("donationType");

-- CreateIndex
CREATE INDEX "DonationRequest_urgencyLevel_idx" ON "DonationRequest"("urgencyLevel");

-- CreateIndex
CREATE INDEX "DonationRequest_recipientId_status_idx" ON "DonationRequest"("recipientId", "status");

-- CreateIndex
CREATE INDEX "Match_intentId_idx" ON "Match"("intentId");

-- CreateIndex
CREATE INDEX "Match_requestId_idx" ON "Match"("requestId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "User_Role_idx" ON "User"("Role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_identityStatus_idx" ON "User"("identityStatus");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
