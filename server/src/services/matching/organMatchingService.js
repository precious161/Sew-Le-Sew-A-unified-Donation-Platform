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

const URGENCY_SCORES = { Critical: 1000, High: 500, Medium: 200, Low: 0 };

const ORGAN_SENSITIVITY = {
  heart: { requireSizeMatch: true, maxVariance: 15 },
  lung: { requireSizeMatch: true, maxVariance: 15 },
  liver: { requireSizeMatch: true, maxVariance: 20 },
  kidney: { requireSizeMatch: false, maxVariance: 100 },
  cornea: { requireSizeMatch: false, maxVariance: 100 },
};

export const runOrganMatching = async () => {
  try {
    const activeIntents = await prisma.donationIntent.findMany({
      where: { category: "Organ", status: "Active" },
      include: { user: { include: { healthInfo: true } } },
    });

    const pendingRequests = await prisma.donationRequest.findMany({
      where: { donationType: "Organ", status: "Pending" },
      include: { user: { include: { healthInfo: true } } },
    });

    if (activeIntents.length === 0 || pendingRequests.length === 0) return;

    const today = new Date();
    const scoredRequests = pendingRequests.map(request => {
      let score = URGENCY_SCORES[request.urgencyLevel] || 0;
      const daysWaiting = Math.floor((today - new Date(request.requestDate)) / (1000 * 60 * 60 * 24));
      score += (daysWaiting * 5);
      return { ...request, matchScore: score };
    });

    scoredRequests.sort((a, b) => b.matchScore - a.matchScore);
    const usedIntentIds = new Set();

    for (const request of scoredRequests) {
      const requiredOrgan = request.organType?.toLowerCase().trim();
      if (!requiredOrgan) continue;

      const organRules = ORGAN_SENSITIVITY[requiredOrgan] || { requireSizeMatch: false, maxVariance: 100 };
      const recipientWeight = request.user.healthInfo?.weight;
      const requiredBloodType = request.requiredBloodType || request.user.bloodType;

      const compatibleIntents = activeIntents.filter(intent => {
        if (usedIntentIds.has(intent.id)) return false;

        const offeredOrgan = intent.itemType?.toLowerCase().trim();
        if (offeredOrgan !== requiredOrgan) return false;

        const donorBloodType = intent.user.bloodType;
        if (!donorBloodType || !BLOOD_COMPATIBILITY[donorBloodType]?.includes(requiredBloodType)) return false;

        const donorLocation = intent.location?.toLowerCase() || "";
        const recipientLocation = request.hospitalName?.toLowerCase() || "";
        const isSameRegion = donorLocation.includes("addis") && recipientLocation.includes("addis");

        if ((requiredOrgan === 'heart' || requiredOrgan === 'lung') && !isSameRegion) return false;

        if (organRules.requireSizeMatch && recipientWeight) {
          const donorWeight = intent.user.healthInfo?.weight;
          if (!donorWeight) return false;

          const weightDifference = Math.abs(donorWeight - recipientWeight);
          const percentageDifference = (weightDifference / recipientWeight) * 100;
          if (percentageDifference > organRules.maxVariance) return false;
        }
        return true;
      });

      if (compatibleIntents.length === 0) continue;

      const bestIntent = compatibleIntents.sort((a, b) => {
        const diffA = Math.abs((a.user.healthInfo?.weight || 0) - (recipientWeight || 0));
        const diffB = Math.abs((b.user.healthInfo?.weight || 0) - (recipientWeight || 0));
        return diffA - diffB;
      })[0];

      await prisma.$transaction(async (tx) => {
        await tx.match.create({ data: { intentId: bestIntent.id, requestId: request.id, status: "Pending" }});
        await tx.donationIntent.update({ where: { id: bestIntent.id }, data: { status: "Matched" } });
        await tx.donationRequest.update({ where: { id: request.id }, data: { status: "Matching" } });

        await tx.notification.create({ data: { userId: bestIntent.userId, message: `URGENT: You are a confirmed local match for a ${request.organType} transplant.` }});
        await tx.notification.create({ data: { userId: request.recipientId, message: `Medical Alert: A fully compatible ${request.organType} donor has been identified.` }});
      });

      usedIntentIds.add(bestIntent.id);
    }
  } catch (error) {
    console.error("runOrganMatching Error:", error);
    throw error;
  }
};

export const handleOrganDonorResponse = async (matchId, donorId, accepted) => {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { intent: true, request: true } });
  if (!match || match.intent.userId !== donorId) throw new Error("Match not found or unauthorized.");

  if (accepted) {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({ where: { id: matchId }, data: { status: "Accepted", acceptedAt: new Date() }});
      await tx.notification.create({ data: { userId: match.request.recipientId, message: `Your organ donor has confirmed! The Red Cross will contact you.` }});
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({ where: { id: matchId }, data: { status: "Declined", declinedAt: new Date() }});
      await tx.donationIntent.update({ where: { id: match.intentId }, data: { status: "Active" }});
      await tx.donationRequest.update({ where: { id: match.requestId }, data: { status: "Pending" }});
    });
    await runOrganMatching();
  }
};

export const confirmOrganCompletion = async (matchId, adminId) => {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { intent: true } });
  if (!match) throw new Error("Match not found.");

  await prisma.$transaction(async (tx) => {
    // 1. Update Records
    await tx.match.update({ where: { id: matchId }, data: { status: "Completed", completedAt: new Date(), confirmedBy: adminId }});
    await tx.donationIntent.update({ where: { id: match.intentId }, data: { status: "Completed" }});
    await tx.donationRequest.update({ where: { id: match.requestId }, data: { status: "Fulfilled" }});

    // 2. Organ donors get a 10-year cooldown
    await tx.userEligibilityStatus.upsert({
      where: { userId_category: { userId: match.intent.userId, category: "Organ" } },
      update: { status: "Ineligible", ineligibleUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) },
      create: { userId: match.intent.userId, category: "Organ", status: "Ineligible", ineligibleUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) }
    });

    // 3. --- CREATE DONATION HISTORY ---
    await tx.donationHistory.create({
      data: {
        donorId: match.intent.userId,
        donationType: "Organ",
        quantity: 1,
        location: match.intent.location,
        matchId: match.id,
        remarks: `Successfully donated a ${match.intent.itemType}. Transplant verified.`,
      }
    });

    // 4. Notifications
    await tx.notification.create({ data: { userId: match.intent.userId, message: `Your ${match.intent.itemType} transplant has been marked complete and added to your History. Thank you for saving a life!` }});
  });
};

export const getAllOrganMatches = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [matches, totalCount] = await Promise.all([
    prisma.match.findMany({ skip, take: limit, where: { intent: { category: "Organ" } }, include: { intent: { include: { user: true } }, request: { include: { user: true } }, confirmedByUser: true }, orderBy: { createdAt: "desc" } }),
    prisma.match.count({ where: { intent: { category: "Organ" } } }),
  ]);
  return { matches, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

export const getUnmatchedOrganRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({ skip, take: limit, where: { donationType: "Organ", status: "Pending" }, include: { user: true }, orderBy: [{ urgencyLevel: "desc" }, { requestDate: "asc" }] }),
    prisma.donationRequest.count({ where: { donationType: "Organ", status: "Pending" } }),
  ]);
  return { requests, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

export const getOrganMatchById = async (matchId) => {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { intent: { include: { user: true } }, request: { include: { user: true } }, confirmedByUser: true } });
  if (!match) throw new Error("Match not found.");
  return match;
};