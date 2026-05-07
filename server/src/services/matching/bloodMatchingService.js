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


export const runBloodMatching = async () => {
  // 1. Fetch all pending blood requests ordered by urgency and date
  const pendingRequests = await prisma.donationRequest.findMany({
    where: {
      donationType: "Blood",
      status: "Pending",
      requiredBloodType: { not: null },
    },
    include: {
      user: {
        include: {
          healthInfo: true,
        },
      },
    },
    orderBy: [
      { urgencyLevel: "desc" },
      { requestDate: "asc" },
    ],
  });

  if (pendingRequests.length === 0) return;

  // 2. Fetch all active blood donor intents
  const activeIntents = await prisma.donationIntent.findMany({
  where: { category: "Blood", status: "Active" },
  include: {
    user: true,
  },
});

  if (activeIntents.length === 0) return;

  // 3. Track which intents have been used in this run
  // so one donor doesn't get matched to multiple recipients
  const usedIntentIds = new Set();

  // 4. Process each request
  for (const request of pendingRequests) {
    const requiredBloodType = request.requiredBloodType;

    // Find compatible available donors for this request
    const compatibleIntents = activeIntents.filter((intent) => {
      // Skip already matched intents in this run
      if (usedIntentIds.has(intent.id)) return false;

      // Donor must have health info with blood type
      const donorBloodType = intent.user.bloodType;
      if (!donorBloodType) return false;

      // Check compatibility
      const canDonateTo = BLOOD_COMPATIBILITY[donorBloodType];
      return canDonateTo?.includes(requiredBloodType);
    });

    if (compatibleIntents.length === 0) continue;

    // 5. Pick the best donor
    // For now: first available compatible donor
    // (can be enhanced with proximity later)
    const bestIntent = compatibleIntents[0];

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
          message: `You have been matched as a blood donor for a ${request.urgencyLevel} priority request. Please confirm your availability.`,
        },
      });

      // Notify the recipient
      await tx.notification.create({
        data: {
          userId: request.recipientId,
          message: `Great news! A compatible blood donor has been found for your request. Please wait for donor confirmation.`,
        },
      });
    });

    // Mark this intent as used for this run
    usedIntentIds.add(bestIntent.id);
  }
};


export const handleDonorResponse = async (matchId, donorId, accepted) => {
  // 1. Fetch the match with related data
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

  // 2. Verify the donor owns this intent
  if (match.intent.userId !== donorId) {
    const error = new Error("You are not authorized to respond to this match.");
    error.statusCode = 403;
    throw error;
  }

  // 3. Verify match is in Notified or Pending state
  if (!["Pending", "Notified"].includes(match.status)) {
    const error = new Error("This match is no longer awaiting a response.");
    error.statusCode = 400;
    throw error;
  }

  if (accepted) {
    // ── DONOR ACCEPTED ──
    await prisma.$transaction(async (tx) => {
      // Update match status
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
          message: `Your blood donor has confirmed. Please visit the Red Cross Center at ${match.intent.location} on ${match.intent.plannedDate.toDateString()} for the donation.`,
        },
      });

      // Notify donor with appointment details
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
      // Update match status
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
          message: `Your donor was unable to confirm. We are finding you another compatible donor, please hold on.`,
        },
      });
    });

    // Trigger re-matching immediately
    await runBloodMatching();
  }
};


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

    // Reset donor eligibility to Ineligible with 90 day cooldown
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

    // Notify donor
    await tx.notification.create({
      data: {
        userId: match.intent.userId,
        message: `Your blood donation has been completed and confirmed. Thank you for saving a life! You will be eligible to donate again in 90 days.`,
      },
    });

    // Notify recipient
    await tx.notification.create({
      data: {
        userId: match.request.recipientId,
        message: `Your blood donation request has been fulfilled. We hope you have a speedy recovery!`,
      },
    });
  });
};