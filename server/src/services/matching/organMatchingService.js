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

export const runOrganMatching = async () => {
  try {
    const activeIntents = await prisma.donationIntent.findMany({
      where: { category: "Organ", status: "Active" },
      include: { user: true },
    });

    const pendingRequests = await prisma.donationRequest.findMany({
      where: { donationType: "Organ", status: "Pending" },
      include: { user: true },
    });

    if (activeIntents.length === 0 || pendingRequests.length === 0) return;

    const usedIntentIds = new Set();

    for (const request of pendingRequests) {
      const requiredOrgan = request.organType?.toLowerCase().trim();
      const requiredBloodType = request.requiredBloodType || request.user.bloodType;

      const compatibleIntents = activeIntents.filter(intent => {
        if (usedIntentIds.has(intent.id)) return false;
        const offeredOrgan = intent.itemType?.toLowerCase().trim();
        const donorBloodType = intent.user.bloodType;

        // 1. Check Organ Name
        if (offeredOrgan !== requiredOrgan) return false;
        // 2. Check Blood Compatibility
        if (!donorBloodType || !BLOOD_COMPATIBILITY[donorBloodType]?.includes(requiredBloodType)) return false;
        
        return true; 
      });

      if (compatibleIntents.length === 0) continue;

      const bestIntent = compatibleIntents[0];

      await prisma.$transaction([
        prisma.match.create({
          data: { intentId: bestIntent.id, requestId: request.id, status: "Pending" }
        }),
        prisma.donationIntent.update({ where: { id: bestIntent.id }, data: { status: "Matched" } }),
        prisma.donationRequest.update({ where: { id: request.id }, data: { status: "Matching" } }),
        prisma.notification.create({
          data: { userId: bestIntent.userId, message: `A life-saving organ match has been found for you!` }
        })
      ]);
      usedIntentIds.add(bestIntent.id);
    }
  } catch (error) {
    console.error("Organ Match Engine Error:", error);
  }
};

export const getAllOrganMatches = async () => {
  return await prisma.match.findMany({
    where: { intent: { category: "Organ" } },
    include: { intent: { include: { user: true } }, request: { include: { user: true } } },
    orderBy: { createdAt: "desc" }
  });
};
// ... other getters ...