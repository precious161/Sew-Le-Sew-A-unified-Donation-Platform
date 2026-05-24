-- CreateTable
CREATE TABLE "ChatInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "interactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Answered',

    CONSTRAINT "ChatInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatInteraction_userId_idx" ON "ChatInteraction"("userId");

-- CreateIndex
CREATE INDEX "ChatInteraction_interactionDate_idx" ON "ChatInteraction"("interactionDate");
