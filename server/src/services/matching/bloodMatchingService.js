import prisma from "../../config/db.js";
import logger from "../../utils/logger.js";

const BLOOD_COMPATIBILITY = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

export const runBloodMatching = async () => {
  try {
    logger.info('🔄 Running Blood Matching Engine...');

    const pendingRequests = await prisma.donationRequest.findMany({
      where: { donationType: "Blood", status: "Pending", requiredBloodType: { not: null } },
      orderBy: [{ urgencyLevel: "desc" }, { requestDate: "asc" }],
    });

    if (pendingRequests.length === 0) {
      logger.info('No pending blood requests found');
      return;
    }

    const activeIntents = await prisma.donationIntent.findMany({
      where: { category: "Blood", status: "Active" },
      include: { user: true },
    });

    if (activeIntents.length === 0) {
      logger.info('No active blood donors found');
      return;
    }

    const usedIntentIds = new Set();
    let matchCount = 0;

    for (const request of pendingRequests) {
      const requiredBloodType = request.requiredBloodType;

      const compatibleIntents = activeIntents.filter((intent) => {
        if (usedIntentIds.has(intent.id)) return false;
        const donorBloodType = intent.user.bloodType;
        if (!donorBloodType) return false;
        return BLOOD_COMPATIBILITY[donorBloodType]?.includes(requiredBloodType);
      });

      if (compatibleIntents.length === 0) continue;

      const bestIntent = compatibleIntents[0];

      await prisma.$transaction(async (tx) => {
        await tx.match.create({
          data: { intentId: bestIntent.id, requestId: request.id, status: "Pending" },
        });
        await tx.donationIntent.update({ where: { id: bestIntent.id }, data: { status: "Matched" } });
        await tx.donationRequest.update({ where: { id: request.id }, data: { status: "Matching" } });

        await tx.notification.create({
          data: { userId: bestIntent.userId, message: `🔔 MATCH ALERT: You have been matched as a blood donor for a ${request.urgencyLevel} priority request. Please check your dashboard to respond.` }
        });
        await tx.notification.create({
          data: { userId: request.recipientId, message: `🎉 Good news! A compatible blood donor has been found for your ${request.urgencyLevel} priority request.` }
        });
      });

      matchCount++;
      usedIntentIds.add(bestIntent.id);
    }

    logger.info(`✅ Blood matching completed! Created ${matchCount} matches.`);
  } catch (error) {
    logger.error("runBloodMatching Error:", error);
    throw error;
  }
};

export const handleDonorResponse = async (matchId, donorId, accepted) => {
  logger.info(`🔄 Donor ${donorId} responding to blood match ${matchId}: ${accepted ? 'ACCEPTED' : 'DECLINED'}`);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { intent: true, request: true }
  });

  if (!match || match.intent.userId !== donorId) {
    logger.warn(`Unauthorized blood match response attempt`, { matchId, donorId });
    throw new Error("Match not found or unauthorized.");
  }

  if (accepted) {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: "Accepted", acceptedAt: new Date() }
      });
      await tx.notification.create({
        data: { userId: match.request.recipientId, message: `✅ Your blood donor has confirmed. Please visit the Red Cross Center.` }
      });
      await tx.notification.create({
        data: { userId: donorId, message: `✅ Thank you for confirming! Please visit the Red Cross Center at ${match.intent.location}.` }
      });
    });
    logger.info(`✅ Blood match accepted`, { matchId, donorId });
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
    logger.info(`❌ Blood match declined`, { matchId, donorId });
    await runBloodMatching();
  }
};

export const confirmDonationCompletion = async (matchId, adminId) => {
  logger.info(`✅ Admin ${adminId} confirming completion of blood match ${matchId}`);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { intent: true, request: true }
  });

  if (!match) {
    logger.error(`Blood match not found: ${matchId}`);
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
          category: "Blood"
        }
      },
      update: {
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      create: {
        userId: match.intent.userId,
        category: "Blood",
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });

    await tx.donationHistory.create({
      data: {
        donorId: match.intent.userId,
        donationType: "Blood",
        quantity: 1,
        location: match.intent.location,
        matchId: match.id,
        remarks: "Successfully donated 1 unit of blood.",
        donationDate: new Date(),
        status: "Completed",
      }
    });

    await tx.notification.create({
      data: {
        userId: match.intent.userId,
        message: `🎉 Your blood donation has been completed and added to your Donation History! You will be eligible to donate again in 90 days.`
      }
    });
    await tx.notification.create({
      data: {
        userId: match.request.recipientId,
        message: `🎉 Your blood donation request has been fulfilled. Thank you for using Sew Le Sew.`
      }
    });
  });

  logger.info(`✅ Blood donation ${matchId} completed and added to history`);
};

export const getAllBloodMatches = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [matches, totalCount] = await Promise.all([
    prisma.match.findMany({
      skip,
      take: limit,
      where: { intent: { category: "Blood" } },
      include: {
        intent: { include: { user: true } },
        request: { include: { user: true } },
        confirmedByUser: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.match.count({ where: { intent: { category: "Blood" } } }),
  ]);
  return { matches, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

export const getBloodMatchById = async (matchId) => {
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

export const getUnmatchedBloodRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: { donationType: "Blood", status: "Pending" },
      include: { user: true },
      orderBy: [{ urgencyLevel: "desc" }, { requestDate: "asc" }]
    }),
    prisma.donationRequest.count({ where: { donationType: "Blood", status: "Pending" } }),
  ]);
  return { requests, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};