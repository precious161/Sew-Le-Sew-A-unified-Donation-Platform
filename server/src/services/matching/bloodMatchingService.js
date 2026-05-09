
import prisma from "../../config/db.js";

const BLOOD_COMPATIBILITY = {
  "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+":  ["O+", "A+", "B+", "AB+"],
  "A-":  ["A-", "A+", "AB-", "AB+"],
  "A+":  ["A+", "AB+"],
  "B-":  ["B-", "B+", "AB-", "AB+"],
  "B+":  ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// ─────────────────────────────────────────
// Core Matching Engine
// ─────────────────────────────────────────
export const runBloodMatching = async () => {
  try {
    // 1. Fetch all verified pending blood requests
    // ordered by urgency and date
    const pendingRequests = await prisma.donationRequest.findMany({
      where: {
        donationType: "Blood",
        status: "Pending",
        requiredBloodType: { not: null },
      },
      orderBy: [
        { urgencyLevel: "desc" },
        { requestDate: "asc" },
      ],
    });

    if (pendingRequests.length === 0) return;

    // 2. Fetch all active blood donor intents
    const activeIntents = await prisma.donationIntent.findMany({
      where: {
        category: "Blood",
        status: "Active",
      },
      include: {
        user: true,
      },
    });

    if (activeIntents.length === 0) return;

    // 3. Track used intents in this run
    // so one donor doesn't get matched to multiple recipients
    const usedIntentIds = new Set();

    // 4. Process each request
    for (const request of pendingRequests) {
      const requiredBloodType = request.requiredBloodType;

      // Find compatible available donors for this request
      const compatibleIntents = activeIntents.filter((intent) => {
        if (usedIntentIds.has(intent.id)) return false;

        const donorBloodType = intent.user.bloodType;
        if (!donorBloodType) return false;

        const canDonateTo = BLOOD_COMPATIBILITY[donorBloodType];
        return canDonateTo?.includes(requiredBloodType);
      });

      if (compatibleIntents.length === 0) continue;

      // 5. Pick best donor — first compatible available
      const bestIntent = compatibleIntents[0];

      // 6. Create match and update all records atomically
      await prisma.$transaction(async (tx) => {
        await tx.match.create({
          data: {
            intentId: bestIntent.id,
            requestId: request.id,
            status: "Pending",
          },
        });

        await tx.donationIntent.update({
          where: { id: bestIntent.id },
          data: { status: "Matched" },
        });

        await tx.donationRequest.update({
          where: { id: request.id },
          data: { status: "Matching" },
        });

        await tx.notification.create({
          data: {
            userId: bestIntent.userId,
            message: `You have been matched as a blood donor for a ${request.urgencyLevel} priority request. Please confirm your availability.`,
          },
        });

        await tx.notification.create({
          data: {
            userId: request.recipientId,
            message: `Great news! A compatible blood donor has been found for your ${request.urgencyLevel} priority request. Please wait for donor confirmation.`,
          },
        });
      });

      usedIntentIds.add(bestIntent.id);
    }
  } catch (error) {
    console.error("runBloodMatching Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────
// Donor Response Handler
// ─────────────────────────────────────────
export const handleDonorResponse = async (matchId, donorId, accepted) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      intent: true,
      request: true,
    },
  });

  if (!match) {
    const error = new Error("Match not found.");
    error.statusCode = 404;
    throw error;
  }

  if (match.intent.userId !== donorId) {
    const error = new Error("You are not authorized to respond to this match.");
    error.statusCode = 403;
    throw error;
  }

  if (!["Pending", "Notified"].includes(match.status)) {
    const error = new Error("This match is no longer awaiting a response.");
    error.statusCode = 400;
    throw error;
  }

  if (accepted) {
    // ── DONOR ACCEPTED ──
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: "Accepted",
          acceptedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: match.request.recipientId,
          message: `Your blood donor has confirmed. Please visit the Red Cross Center at ${match.intent.location} on ${match.intent.plannedDate.toDateString()} for the donation.`,
        },
      });

      await tx.notification.create({
        data: {
          userId: donorId,
          message: `Thank you for confirming! Please visit the Red Cross Center at ${match.intent.location} on ${match.intent.plannedDate.toDateString()} to complete your donation.`,
        },
      });
    });
  } else {
    // ── DONOR DECLINED ──
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: "Declined",
          declinedAt: new Date(),
        },
      });

      await tx.donationIntent.update({
        where: { id: match.intentId },
        data: { status: "Active" },
      });

      await tx.donationRequest.update({
        where: { id: match.requestId },
        data: { status: "Pending" },
      });

      await tx.notification.create({
        data: {
          userId: match.request.recipientId,
          message: `Your donor was unable to confirm. We are finding you another compatible donor, please hold on.`,
        },
      });
    });

    // Re-match immediately
    await runBloodMatching();
  }
};

// ─────────────────────────────────────────
// Admin: Confirm physical donation happened
// ─────────────────────────────────────────
export const confirmDonationCompletion = async (matchId, adminId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      intent: true,
      request: true,
    },
  });

  if (!match) {
    const error = new Error("Match not found.");
    error.statusCode = 404;
    throw error;
  }

  if (match.status !== "Accepted") {
    const error = new Error("Only accepted matches can be marked as completed.");
    error.statusCode = 400;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "Completed",
        completedAt: new Date(),
        confirmedBy: adminId,
      },
    });

    await tx.donationIntent.update({
      where: { id: match.intentId },
      data: { status: "Completed" },
    });

    await tx.donationRequest.update({
      where: { id: match.requestId },
      data: { status: "Fulfilled" },
    });

    // Reset donor eligibility with 90 day cooldown
    await tx.userEligibilityStatus.update({
      where: {
        userId_category: {
          userId: match.intent.userId,
          category: "Blood",
        },
      },
      data: {
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.notification.create({
      data: {
        userId: match.intent.userId,
        message: `Your blood donation has been completed and confirmed. Thank you for saving a life! You will be eligible to donate again in 90 days.`,
      },
    });

    await tx.notification.create({
      data: {
        userId: match.request.recipientId,
        message: `Your blood donation request has been fulfilled. We hope you have a speedy recovery!`,
      },
    });
  });
};

// ─────────────────────────────────────────
// Admin: Get all blood matches
// ─────────────────────────────────────────
export const getAllBloodMatches = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [matches, totalCount] = await Promise.all([
    prisma.match.findMany({
      skip,
      take: limit,
      where: {
        intent: { category: "Blood" },
      },
      include: {
        intent: {
          include: {
            user: {
              select: {
                id: true,
                FirstName: true,
                LastName: true,
                EmailAddress: true,
                bloodType: true,
              },
            },
          },
        },
        request: {
          include: {
            user: {
              select: {
                id: true,
                FirstName: true,
                LastName: true,
                EmailAddress: true,
              },
            },
          },
        },
        confirmedByUser: {
          select: {
            id: true,
            FirstName: true,
            LastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.count({
      where: {
        intent: { category: "Blood" },
      },
    }),
  ]);

  return {
    matches,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// ─────────────────────────────────────────
// Admin: Get single match by ID
// ─────────────────────────────────────────
export const getBloodMatchById = async (matchId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      intent: {
        include: {
          user: {
            select: {
              id: true,
              FirstName: true,
              LastName: true,
              EmailAddress: true,
              bloodType: true,
              PhoneNumber: true,
            },
          },
        },
      },
      request: {
        include: {
          user: {
            select: {
              id: true,
              FirstName: true,
              LastName: true,
              EmailAddress: true,
              PhoneNumber: true,
            },
          },
        },
      },
      confirmedByUser: {
        select: {
          id: true,
          FirstName: true,
          LastName: true,
        },
      },
    },
  });

  if (!match) {
    const error = new Error("Match not found.");
    error.statusCode = 404;
    throw error;
  }

  return match;
};

// ─────────────────────────────────────────
// Admin: Get all unmatched pending blood requests
// ─────────────────────────────────────────
export const getUnmatchedBloodRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: {
        donationType: "Blood",
        status: "Pending",
      },
      include: {
        user: {
          select: {
            id: true,
            FirstName: true,
            LastName: true,
            EmailAddress: true,
            PhoneNumber: true,
          },
        },
      },
      orderBy: [
        { urgencyLevel: "desc" },
        { requestDate: "asc" },
      ],
    }),
    prisma.donationRequest.count({
      where: {
        donationType: "Blood",
        status: "Pending",
      },
    }),
  ]);

  return {
    requests,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};