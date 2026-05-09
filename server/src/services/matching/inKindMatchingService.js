
import prisma from "../../config/db.js";

// ─────────────────────────────────────────
// Core In-Kind Matching Engine
// ─────────────────────────────────────────
export const runInKindMatching = async () => {
  try {
    // 1. Fetch all verified pending In-Kind requests
    const pendingRequests = await prisma.donationRequest.findMany({
      where: {
        donationType: "In_Kind",
        status: "Pending",
        itemType: { not: null },
      },
      orderBy: [
        { urgencyLevel: "desc" },
        { requestDate: "asc" },
      ],
    });

    if (pendingRequests.length === 0) return;

    // 2. Fetch all active In-Kind donor intents
    const activeIntents = await prisma.donationIntent.findMany({
      where: {
        category: "In_Kind",
        status: "Active",
        itemType: { not: null },
      },
    });

    if (activeIntents.length === 0) return;

    // 3. Track used intents in this run
    const usedIntentIds = new Set();

    // 4. Process each request
    for (const request of pendingRequests) {
      const requiredItem = request.itemType.toLowerCase().trim();
      const requiredQuantity = request.itemQuantity || 1;

      // Find compatible donors for this request
      const compatibleIntents = activeIntents.filter((intent) => {
        if (usedIntentIds.has(intent.id)) return false;

        const offeredItem = intent.itemType?.toLowerCase().trim();
        if (offeredItem !== requiredItem) return false;

        const offeredQuantity = intent.quantity || 0;
        if (offeredQuantity < requiredQuantity) return false;

        return true;
      });

      if (compatibleIntents.length === 0) continue;

      // 5. Pick donor whose quantity is closest to required
      // avoids over-allocating large donations to small requests
      const bestIntent = [...compatibleIntents].sort((a, b) => {
        const diffA = (a.quantity || 0) - requiredQuantity;
        const diffB = (b.quantity || 0) - requiredQuantity;
        return diffA - diffB;
      })[0];

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
            message: `You have been matched for an In-Kind donation. A recipient needs ${requiredQuantity} unit(s) of ${request.itemType}. Please confirm your availability.`,
          },
        });

        await tx.notification.create({
          data: {
            userId: request.recipientId,
            message: `Great news! A donor has been found for your ${request.itemType} request. Please wait for donor confirmation.`,
          },
        });
      });

      usedIntentIds.add(bestIntent.id);
    }
  } catch (error) {
    console.error("runInKindMatching Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────
// Donor Response Handler
// ─────────────────────────────────────────
export const handleInKindDonorResponse = async (matchId, donorId, accepted) => {
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
          message: `Your donor has confirmed the In-Kind donation of ${match.request.itemType}. Please visit the Red Cross Center at ${match.intent.location} on ${match.intent.plannedDate.toDateString()} to collect your items.`,
        },
      });

      await tx.notification.create({
        data: {
          userId: donorId,
          message: `Thank you for confirming! Please bring ${match.intent.quantity} unit(s) of ${match.intent.itemType} to the Red Cross Center at ${match.intent.location} on ${match.intent.plannedDate.toDateString()}.`,
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
          message: `Your donor was unable to confirm the In-Kind donation. We are finding you another donor, please hold on.`,
        },
      });
    });

    // Re-match immediately
    await runInKindMatching();
  }
};

// ─────────────────────────────────────────
// Admin: Confirm physical donation happened
// ─────────────────────────────────────────
export const confirmInKindCompletion = async (matchId, adminId) => {
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

    // Reset donor eligibility with 30 day cooldown for In-Kind
    await tx.userEligibilityStatus.update({
      where: {
        userId_category: {
          userId: match.intent.userId,
          category: "In_Kind",
        },
      },
      data: {
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.notification.create({
      data: {
        userId: match.intent.userId,
        message: `Your In-Kind donation of ${match.intent.quantity} unit(s) of ${match.intent.itemType} has been completed and confirmed. Thank you for your generosity! You will be eligible to donate again in 30 days.`,
      },
    });

    await tx.notification.create({
      data: {
        userId: match.request.recipientId,
        message: `Your In-Kind donation request for ${match.request.itemType} has been fulfilled. Thank you for using Sew Le Sew!`,
      },
    });
  });
};

// ─────────────────────────────────────────
// Admin: Get all In-Kind matches
// ─────────────────────────────────────────
export const getAllInKindMatches = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [matches, totalCount] = await Promise.all([
    prisma.match.findMany({
      skip,
      take: limit,
      where: {
        intent: { category: "In_Kind" },
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
        intent: { category: "In_Kind" },
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
// Admin: Get single In-Kind match by ID
// ─────────────────────────────────────────
export const getInKindMatchById = async (matchId) => {
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
// Admin: Get all unmatched pending In-Kind requests
// ─────────────────────────────────────────
export const getUnmatchedInKindRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: {
        donationType: "In_Kind",
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
        donationType: "In_Kind",
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