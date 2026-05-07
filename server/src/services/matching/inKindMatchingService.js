// inKindMatchingService.js
import prisma from "../../config/db.js";

export const runInKindMatching = async () => {
  // 1. Fetch all pending In-Kind requests ordered by urgency and date
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

    // Find compatible available donors for this request
    const compatibleIntents = activeIntents.filter((intent) => {
      // Skip already used intents in this run
      if (usedIntentIds.has(intent.id)) return false;

      // Item type must match (case-insensitive)
      const offeredItem = intent.itemType?.toLowerCase().trim();
      if (offeredItem !== requiredItem) return false;

      // Donor quantity must fully cover the request (Option A)
      const offeredQuantity = intent.quantity || 0;
      if (offeredQuantity < requiredQuantity) return false;

      return true;
    });

    if (compatibleIntents.length === 0) continue;

    // 5. Pick the best donor
    // Prefer donor whose quantity is closest to the required amount
    // to avoid over-allocating large donations to small requests
    const bestIntent = compatibleIntents.sort((a, b) => {
      const diffA = (a.quantity || 0) - requiredQuantity;
      const diffB = (b.quantity || 0) - requiredQuantity;
      return diffA - diffB;
    })[0];

    // 6. Create the match and update all related records atomically
    await prisma.$transaction(async (tx) => {
      // Create the match record
      await tx.match.create({
        data: {
          intentId: bestIntent.id,
          requestId: request.id,
          status: "Pending",
        },
      });

      // Update donor intent status to Matched
      await tx.donationIntent.update({
        where: { id: bestIntent.id },
        data: { status: "Matched" },
      });

      // Update request status to Matching
      await tx.donationRequest.update({
        where: { id: request.id },
        data: { status: "Matching" },
      });

      // Notify the donor
      await tx.notification.create({
        data: {
          userId: bestIntent.userId,
          message: `You have been matched for an In-Kind donation. A recipient needs ${requiredQuantity} unit(s) of ${request.itemType}. Please confirm your availability.`,
        },
      });

      // Notify the recipient
      await tx.notification.create({
        data: {
          userId: request.recipientId,
          message: `Great news! A donor has been found for your ${request.itemType} request. Please wait for donor confirmation.`,
        },
      });
    });

    // Mark this intent as used for this run
    usedIntentIds.add(bestIntent.id);
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

  // Verify the donor owns this intent
  if (match.intent.userId !== donorId) {
    const error = new Error("You are not authorized to respond to this match.");
    error.statusCode = 403;
    throw error;
  }

  // Verify match is awaiting response
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

      // Notify recipient
      await tx.notification.create({
        data: {
          userId: match.request.recipientId,
          message: `Your donor has confirmed the In-Kind donation of ${match.request.itemType}. Please visit the Red Cross Center at ${match.intent.location} on ${match.intent.plannedDate.toDateString()} to collect your items.`,
        },
      });

      // Notify donor
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

      // Free up the donor intent back to Active
      await tx.donationIntent.update({
        where: { id: match.intentId },
        data: { status: "Active" },
      });

      // Put request back to Pending for re-matching
      await tx.donationRequest.update({
        where: { id: match.requestId },
        data: { status: "Pending" },
      });

      // Notify recipient
      await tx.notification.create({
        data: {
          userId: match.request.recipientId,
          message: `Your donor was unable to confirm the In-Kind donation. We are finding you another donor, please hold on.`,
        },
      });
    });

    // Trigger re-matching immediately
    await runInKindMatching();
  }
};

// ─────────────────────────────────────────
// Admin Completion Handler
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
    // Complete the match
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "Completed",
        completedAt: new Date(),
        confirmedBy: adminId,
      },
    });

    // Complete the donor intent
    await tx.donationIntent.update({
      where: { id: match.intentId },
      data: { status: "Completed" },
    });

    // Fulfill the request
    await tx.donationRequest.update({
      where: { id: match.requestId },
      data: { status: "Fulfilled" },
    });

    // Notify donor
    await tx.notification.create({
      data: {
        userId: match.intent.userId,
        message: `Your In-Kind donation of ${match.intent.quantity} unit(s) of ${match.intent.itemType} has been completed and confirmed. Thank you for your generosity!`,
      },
    });

    // Notify recipient
    await tx.notification.create({
      data: {
        userId: match.request.recipientId,
        message: `Your In-Kind donation request for ${match.request.itemType} has been fulfilled. Thank you for using Sew Le Sew!`,
      },
    });
  });
};