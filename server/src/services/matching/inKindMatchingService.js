import prisma from "../../config/db.js";
import logger from "../../utils/logger.js";

export const runInKindMatching = async () => {
  try {
    logger.info('🔄 Running In-Kind Matching Engine...');

    const pendingRequests = await prisma.donationRequest.findMany({
      where: { donationType: "In_Kind", status: "Pending", itemType: { not: null } },
      orderBy: [{ urgencyLevel: "desc" }, { requestDate: "asc" }],
    });

    if (pendingRequests.length === 0) {
      logger.info('No pending In-Kind requests found');
      return;
    }

    const activeIntents = await prisma.donationIntent.findMany({
      where: { category: "In_Kind", status: "Active", itemType: { not: null } },
    });

    if (activeIntents.length === 0) {
      logger.info('No active In-Kind donors found');
      return;
    }

    const usedIntentIds = new Set();
    let matchCount = 0;

    for (const request of pendingRequests) {
      const requiredItem = request.itemType.toLowerCase().trim();
      const requiredQuantity = request.itemQuantity || 1;

      const compatibleIntents = activeIntents.filter((intent) => {
        if (usedIntentIds.has(intent.id)) return false;
        const offeredItem = intent.itemType?.toLowerCase().trim();
        if (offeredItem !== requiredItem) return false;
        const offeredQuantity = intent.quantity || 0;
        if (offeredQuantity < requiredQuantity) return false;
        return true;
      });

      if (compatibleIntents.length === 0) continue;

      const bestIntent = [...compatibleIntents].sort((a, b) => {
        const diffA = (a.quantity || 0) - requiredQuantity;
        const diffB = (b.quantity || 0) - requiredQuantity;
        return diffA - diffB;
      })[0];

      await prisma.$transaction(async (tx) => {
        await tx.match.create({
          data: { intentId: bestIntent.id, requestId: request.id, status: "Pending" }
        });
        await tx.donationIntent.update({
          where: { id: bestIntent.id },
          data: { status: "Matched" }
        });
        await tx.donationRequest.update({
          where: { id: request.id },
          data: { status: "Matching" }
        });

        await tx.notification.create({
          data: {
            userId: bestIntent.userId,
            message: `🔔 MATCH ALERT: You have been matched for an In-Kind donation. A recipient needs ${requiredQuantity} unit(s) of ${request.itemType}. Please check your dashboard to respond.`
          }
        });
        await tx.notification.create({
          data: {
            userId: request.recipientId,
            message: `🎉 Great news! A donor has been found for your ${request.itemType} request.`
          }
        });
      });

      matchCount++;
      usedIntentIds.add(bestIntent.id);
    }

    logger.info(`✅ In-Kind matching completed! Created ${matchCount} matches.`);
  } catch (error) {
    logger.error("runInKindMatching Error:", error);
    throw error;
  }
};

export const handleInKindDonorResponse = async (matchId, donorId, accepted) => {
  logger.info(`🔄 Donor ${donorId} responding to In-Kind match ${matchId}: ${accepted ? 'ACCEPTED' : 'DECLINED'}`);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { intent: true, request: true }
  });

  if (!match || match.intent.userId !== donorId) {
    logger.warn(`Unauthorized In-Kind match response attempt`, { matchId, donorId });
    throw new Error("Match not found or unauthorized.");
  }

  if (accepted) {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: "Accepted", acceptedAt: new Date() }
      });
      await tx.notification.create({
        data: {
          userId: match.request.recipientId,
          message: `✅ Your donor has confirmed the In-Kind donation of ${match.request.itemType}.`
        }
      });
      await tx.notification.create({
        data: {
          userId: donorId,
          message: `✅ Thank you for confirming! Please bring ${match.intent.quantity || 1} unit(s) of ${match.intent.itemType} to ${match.intent.location}.`
        }
      });
    });
    logger.info(`✅ In-Kind match accepted`, { matchId, donorId });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: "Declined", declinedAt: new Date() }
      });
      await tx.donationIntent.update({
        where: { id: match.intentId },
        data: { status: "Active" }
      });
      await tx.donationRequest.update({
        where: { id: match.requestId },
        data: { status: "Pending" }
      });
    });
    logger.info(`❌ In-Kind match declined`, { matchId, donorId });
    await runInKindMatching();
  }
};

export const confirmInKindCompletion = async (matchId, adminId) => {
  logger.info(`✅ Admin ${adminId} confirming completion of In-Kind match ${matchId}`);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { intent: true, request: true }
  });

  if (!match) {
    logger.error(`In-Kind match not found: ${matchId}`);
    throw new Error("Match not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { status: "Completed", completedAt: new Date(), confirmedBy: adminId }
    });
    await tx.donationIntent.update({
      where: { id: match.intentId },
      data: { status: "Completed" }
    });
    await tx.donationRequest.update({
      where: { id: match.requestId },
      data: { status: "Fulfilled" }
    });

    await tx.userEligibilityStatus.upsert({
      where: {
        userId_category: {
          userId: match.intent.userId,
          category: "In_Kind"
        }
      },
      update: {
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      create: {
        userId: match.intent.userId,
        category: "In_Kind",
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await tx.donationHistory.create({
      data: {
        donorId: match.intent.userId,
        donationType: "In_Kind",
        quantity: match.intent.quantity || 1,
        location: match.intent.location,
        matchId: match.id,
        remarks: `Successfully donated ${match.intent.quantity || 1} units of ${match.intent.itemType}.`,
        donationDate: new Date(),
        status: "Completed",
      }
    });

    await tx.notification.create({
      data: {
        userId: match.intent.userId,
        message: `🎉 Your In-Kind donation of ${match.intent.quantity || 1} unit(s) of ${match.intent.itemType} has been completed and added to your Donation History.`
      }
    });
    await tx.notification.create({
      data: {
        userId: match.request.recipientId,
        message: `🎉 Your In-Kind donation request for ${match.request.itemType} has been fulfilled. Thank you for using Sew Le Sew.`
      }
    });
  });

  logger.info(`✅ In-Kind donation ${matchId} completed and added to history`);
};

export const getAllInKindMatches = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [matches, totalCount] = await Promise.all([
    prisma.match.findMany({
      skip,
      take: limit,
      where: { intent: { category: "In_Kind" } },
      include: {
        intent: { include: { user: true } },
        request: { include: { user: true } },
        confirmedByUser: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.match.count({ where: { intent: { category: "In_Kind" } } }),
  ]);
  return { matches, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

export const getInKindMatchById = async (matchId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      intent: { include: { user: true } },
      request: { include: { user: true } },
      confirmedByUser: true
    }
  });
  if (!match) throw new Error("Match not found.");
  return match;
};

export const getUnmatchedInKindRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: { donationType: "In_Kind", status: "Pending" },
      include: { user: true },
      orderBy: [{ urgencyLevel: "desc" }, { requestDate: "asc" }]
    }),
    prisma.donationRequest.count({ where: { donationType: "In_Kind", status: "Pending" } }),
  ]);
  return { requests, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};