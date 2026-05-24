import prisma from "../../config/db.js";

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

const URGENCY_SCORES = { Critical: 1000, High: 500, Medium: 200, Low: 0 };

const ORGAN_SENSITIVITY = {
  heart: { requireSizeMatch: true, maxVariance: 15 },
  lung: { requireSizeMatch: true, maxVariance: 15 },
  liver: { requireSizeMatch: true, maxVariance: 20 },
  kidney: { requireSizeMatch: false, maxVariance: 100 },
  cornea: { requireSizeMatch: false, maxVariance: 100 },
};

// ─────────────────────────────────────────
// MAIN ORGAN MATCHING ENGINE
// ─────────────────────────────────────────
export const runOrganMatching = async () => {
  try {
    console.log('🔄 Starting Organ Matching Engine...');
    console.log(`⏰ Match run at: ${new Date().toLocaleString()}`);

    const activeIntents = await prisma.donationIntent.findMany({
      where: { category: "Organ", status: "Active" },
      include: { user: { include: { healthInfo: true } } },
    });
    console.log(`📋 Found ${activeIntents.length} active organ donors`);

    const pendingRequests = await prisma.donationRequest.findMany({
      where: { donationType: "Organ", status: "Pending" },
      include: { user: { include: { healthInfo: true } } },
    });
    console.log(`📋 Found ${pendingRequests.length} pending organ requests`);

    if (activeIntents.length === 0 || pendingRequests.length === 0) {
      console.log('⚠️ No donors or requests to match. Exiting organ matching.');
      return;
    }

    // Score requests by urgency and waiting time
    const today = new Date();
    const scoredRequests = pendingRequests.map(request => {
      let score = URGENCY_SCORES[request.urgencyLevel] || 0;
      const daysWaiting = Math.floor((today - new Date(request.requestDate)) / (1000 * 60 * 60 * 24));
      score += (daysWaiting * 5);
      return { ...request, matchScore: score };
    });

    scoredRequests.sort((a, b) => b.matchScore - a.matchScore);

    const usedIntentIds = new Set();
    let matchCount = 0;
    let skipCount = 0;

    for (const request of scoredRequests) {
      const requiredOrgan = request.organType?.toLowerCase().trim();
      if (!requiredOrgan) {
        console.log(`⚠️ Request ${request.id} has no organType specified, skipping`);
        skipCount++;
        continue;
      }

      const organRules = ORGAN_SENSITIVITY[requiredOrgan] || { requireSizeMatch: false, maxVariance: 100 };
      const recipientWeight = request.user.healthInfo?.weight;
      const requiredBloodType = request.requiredBloodType || request.user.healthInfo?.bloodType || request.user.bloodType;

      const compatibleIntents = [];

      for (const intent of activeIntents) {
        if (usedIntentIds.has(intent.id)) continue;

        console.log(`\n--- EVALUATING DONOR: ${intent.user.FirstName} FOR RECIPIENT: ${request.user.FirstName} ---`);

        // TIER 1: Organ
        const offeredOrgan = intent.itemType?.toLowerCase().trim();
        if (offeredOrgan !== requiredOrgan) {
          console.log(`❌ FAILED TIER 1: Donor offered '${offeredOrgan}', Recipient needs '${requiredOrgan}'`);
          continue;
        }
        console.log(`✅ PASSED TIER 1: Organ Type`);

        // TIER 2: Blood
        const donorBloodType = intent.user.bloodType;
        if (!donorBloodType || !BLOOD_COMPATIBILITY[donorBloodType]?.includes(requiredBloodType)) {
          console.log(`❌ FAILED TIER 2: Donor blood '${donorBloodType}' incompatible with Recipient '${requiredBloodType}'`);
          continue;
        }
        console.log(`✅ PASSED TIER 2: Blood Type`);

        // TIER 3: Geography
        const donorLocation = intent.location?.toLowerCase() || "";
        const recipientLocation = request.hospitalName?.toLowerCase() || "";
        const isSameRegion = donorLocation.includes("addis") && recipientLocation.includes("addis");

        if ((requiredOrgan === 'heart' || requiredOrgan === 'lung') && !isSameRegion) {
          console.log(`❌ FAILED TIER 3: Geography. Donor is at '${donorLocation}', Recipient at '${recipientLocation}'`);
          continue;
        }
        console.log(`✅ PASSED TIER 3: Geography`);

        // TIER 4: Biometrics
        if (organRules.requireSizeMatch && recipientWeight) {
          const donorWeight = intent.user.healthInfo?.weight;
          if (!donorWeight) {
            console.log(`❌ FAILED TIER 4: Donor weight is missing!`);
            continue;
          }

          const weightDifference = Math.abs(donorWeight - recipientWeight);
          const percentageDifference = (weightDifference / recipientWeight) * 100;
          if (percentageDifference > organRules.maxVariance) {
            console.log(`❌ FAILED TIER 4: Size Variance too high. Diff is ${percentageDifference.toFixed(1)}% (Max is ${organRules.maxVariance}%)`);
            continue;
          }
        }
        console.log(`✅ PASSED TIER 4: Biometrics`);

        compatibleIntents.push(intent);
      }

      if (compatibleIntents.length === 0) {
        skipCount++;
        continue;
      }

      const bestIntent = compatibleIntents.sort((a, b) => {
        const diffA = Math.abs((a.user.healthInfo?.weight || 0) - (recipientWeight || 0));
        const diffB = Math.abs((b.user.healthInfo?.weight || 0) - (recipientWeight || 0));
        return diffA - diffB;
      })[0];

      await prisma.$transaction(async (tx) => {
        await tx.match.create({
          data: { intentId: bestIntent.id, requestId: request.id, status: "Pending" },
        });
        await tx.donationIntent.update({ where: { id: bestIntent.id }, data: { status: "Matched" } });
        await tx.donationRequest.update({ where: { id: request.id }, data: { status: "Matching" } });

        await tx.notification.create({
          data: {
            userId: bestIntent.userId,
            message: `🔔 MATCH ALERT: You have been matched as an organ donor for a ${request.urgencyLevel} priority ${requiredOrgan} transplant. Please check your dashboard to respond.`
          },
        });
        await tx.notification.create({
          data: {
            userId: request.recipientId,
            message: `🎉 Good news! A compatible organ donor has been found for your ${requiredOrgan} transplant. The donor will be notified to confirm.`
          },
        });
      });

      matchCount++;
      usedIntentIds.add(bestIntent.id);
    }

    console.log(`✅ Organ matching completed! Created ${matchCount} matches. Skipped ${skipCount} requests.`);
  } catch (error) {
    console.error("runOrganMatching Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────
// DONOR RESPONSE HANDLER
// ─────────────────────────────────────────
export const handleOrganDonorResponse = async (matchId, donorId, accepted) => {
  console.log(`🔄 Donor ${donorId} responding to match ${matchId}: ${accepted ? 'ACCEPTED' : 'DECLINED'}`);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { intent: true, request: true }
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  if (match.intent.userId !== donorId) {
    throw new Error("Unauthorized.");
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
          message: `✅ Your organ donor has confirmed! The Red Cross will contact you to arrange the transplant details.`
        }
      });

      await tx.notification.create({
        data: {
          userId: donorId,
          message: `✅ Thank you for accepting the match! A Red Cross coordinator will contact you within 24 hours to discuss next steps.`
        }
      });
    });
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
    // Try to find another donor
    await runOrganMatching();
  }
};

// ─────────────────────────────────────────
// ADMIN COMPLETION HANDLER
// ─────────────────────────────────────────
export const confirmOrganCompletion = async (matchId, adminId) => {
  console.log(`✅ Admin ${adminId} confirming completion of match ${matchId}`);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { intent: true, request: true }
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update match status
    await tx.match.update({
      where: { id: matchId },
      data: { status: "Completed", completedAt: new Date(), confirmedBy: adminId }
    });

    // 2. Update intent status
    await tx.donationIntent.update({
      where: { id: match.intentId },
      data: { status: "Completed" }
    });

    // 3. Update request status
    await tx.donationRequest.update({
      where: { id: match.requestId },
      data: { status: "Fulfilled" }
    });

    // 4. Set donor cooldown (10 years for organ donation)
    await tx.userEligibilityStatus.upsert({
      where: {
        userId_category: {
          userId: match.intent.userId,
          category: "Organ"
        }
      },
      update: {
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000)
      },
      create: {
        userId: match.intent.userId,
        category: "Organ",
        status: "Ineligible",
        ineligibleUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000)
      }
    });

    // 5. Create donation history
    await tx.donationHistory.create({
      data: {
        donorId: match.intent.userId,
        donationType: "Organ",
        quantity: 1,
        location: match.intent.location,
        matchId: match.id,
        remarks: `Successfully donated a ${match.intent.itemType}. Transplant verified by admin.`,
        donationDate: new Date(),
        status: "Completed",
      }
    });

    // 6. Notifications
    await tx.notification.create({
      data: {
        userId: match.intent.userId,
        message: `🎉 Your organ donation has been marked as complete! Thank you for saving a life. This donation has been added to your history.`
      }
    });

    await tx.notification.create({
      data: {
        userId: match.request.recipientId,
        message: `🎉 Your organ transplant has been successfully completed. We wish you a speedy recovery!`
      }
    });
  });

  console.log(`✅ Organ donation ${matchId} completed successfully`);
};

// ─────────────────────────────────────────
// GETTER FUNCTIONS
// ─────────────────────────────────────────
export const getAllOrganMatches = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [matches, totalCount] = await Promise.all([
    prisma.match.findMany({
      skip,
      take: limit,
      where: { intent: { category: "Organ" } },
      include: {
        intent: { include: { user: true } },
        request: { include: { user: true } },
        confirmedByUser: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.match.count({ where: { intent: { category: "Organ" } } }),
  ]);
  return { matches, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

export const getOrganMatchById = async (matchId) => {
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

export const getUnmatchedOrganRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: { donationType: "Organ", status: "Pending" },
      include: { user: true },
      orderBy: [{ urgencyLevel: "desc" }, { requestDate: "asc" }]
    }),
    prisma.donationRequest.count({ where: { donationType: "Organ", status: "Pending" } }),
  ]);
  return { requests, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};