
import prisma from "../../config/db.js";

const getMinimumAmount = async () => {
  const standard = await prisma.medicalStandard.findUnique({
    where: {
      category_ruleKey: {
        category: "Financial",
        ruleKey: "MIN_AMOUNT",
      },
    },
  });

  if (!standard) {
    throw new Error("Financial minimum amount standard not found. Please seed the database.");
  }

  return parseFloat(standard.value);
};

// ─────────────────────────────────────────
// Donor: Submit a contribution pledge
// ─────────────────────────────────────────
export const submitContribution = async (donorId, data) => {
  const { amount, currency, purpose } = data;

  // 1. Fetch minimum amount from MedicalStandard
  const minAmount = await getMinimumAmount();

  if (amount < minAmount) {
    const error = new Error(`Minimum contribution amount is ${minAmount} ETB.`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Create the contribution pledge
  const contribution = await prisma.financialContribution.create({
    data: {
      donorId,
      amount,
      currency: currency || "ETB",
      purpose,
      status: "Pending",
    },
  });

  // 3. Notify the donor
  await prisma.notification.create({
    data: {
      userId: donorId,
      message: `Your contribution pledge of ${amount} ${currency || "ETB"} has been received. Please complete your bank or Telebirr transfer and wait for admin verification.`,
    },
  });

  return contribution;
};

// ─────────────────────────────────────────
// Donor: Cancel a pending contribution
// ─────────────────────────────────────────
export const cancelContribution = async (donorId, contributionId) => {
  // 1. Fetch the contribution
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify the donor owns this contribution
  if (contribution.donorId !== donorId) {
    const error = new Error("You are not authorized to cancel this contribution.");
    error.statusCode = 403;
    throw error;
  }

  // 3. Only Pending contributions can be cancelled
  if (contribution.status !== "Pending") {
    const error = new Error(
      `This contribution cannot be cancelled. Current status: ${contribution.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Mark as Failed (cancelled by donor)
  const updated = await prisma.financialContribution.update({
    where: { id: contributionId },
    data: { status: "Failed" },
  });

  // 5. Notify donor
  await prisma.notification.create({
    data: {
      userId: donorId,
      message: `Your contribution pledge of ${contribution.amount} ${contribution.currency} has been cancelled successfully.`,
    },
  });

  return updated;
};

// ─────────────────────────────────────────
// Donor: View own contributions
// ─────────────────────────────────────────
export const getMyContributions = async (donorId) => {
  return await prisma.financialContribution.findMany({
    where: { donorId },
    orderBy: { createdAt: "desc" },
  });
};

// ─────────────────────────────────────────
// Admin: View all contributions
// ─────────────────────────────────────────
export const getAllContributions = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [contributions, totalCount] = await Promise.all([
    prisma.financialContribution.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        donor: {
          select: {
            id: true,
            FirstName: true,
            LastName: true,
            EmailAddress: true,
          },
        },
      },
    }),
    prisma.financialContribution.count(),
  ]);

  return {
    contributions,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// ─────────────────────────────────────────
// Admin: Verify a contribution
// ─────────────────────────────────────────
export const verifyContribution = async (adminId, contributionId) => {
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.status !== "Pending") {
    const error = new Error(
      `Only pending contributions can be verified. Current status: ${contribution.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.financialContribution.update({
    where: { id: contributionId },
    data: {
      status: "Verified",
      verifiedAt: new Date(),
    },
  });

  // Notify donor
  await prisma.notification.create({
    data: {
      userId: contribution.donorId,
      message: `Your contribution of ${contribution.amount} ${contribution.currency} has been verified by the Red Cross. Thank you for your generosity!`,
    },
  });

  return updated;
};

// ─────────────────────────────────────────
// Admin: Allocate a contribution
// ─────────────────────────────────────────
export const allocateContribution = async (adminId, contributionId, allocationNote) => {
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.status !== "Verified") {
    const error = new Error(
      `Only verified contributions can be allocated. Current status: ${contribution.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.financialContribution.update({
    where: { id: contributionId },
    data: {
      status: "Allocated",
      allocatedBy: adminId,
      allocatedAt: new Date(),
      allocationNote,
    },
  });

  // Notify donor
  await prisma.notification.create({
    data: {
      userId: contribution.donorId,
      message: `Your contribution of ${contribution.amount} ${contribution.currency} has been allocated. Note: ${allocationNote}. Your donation is making a difference!`,
    },
  });

  return updated;
};

// ─────────────────────────────────────────
// Admin: Reject a contribution
// ─────────────────────────────────────────
export const rejectContribution = async (adminId, contributionId) => {
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.status !== "Pending") {
    const error = new Error(
      `Only pending contributions can be rejected. Current status: ${contribution.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.financialContribution.update({
    where: { id: contributionId },
    data: { status: "Failed" },
  });

  // Notify donor
  await prisma.notification.create({
    data: {
      userId: contribution.donorId,
      message: `Your contribution pledge of ${contribution.amount} ${contribution.currency} could not be verified. Please contact the Red Cross for more information.`,
    },
  });

  return updated;
};


export const distributeToRecipient = async (adminId, contributionId, requestId, amount, note) => {
  // 1. Fetch the contribution
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.status !== "Verified") {
    const error = new Error(
      "Only verified contributions can be distributed."
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Fetch the recipient request
  const request = await prisma.donationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    const error = new Error("Donation request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (request.donationType !== "Financial") {
    const error = new Error("This request is not a financial donation request.");
    error.statusCode = 400;
    throw error;
  }

  if (request.status !== "Pending") {
    const error = new Error(
      `This request has already been processed. Current status: ${request.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Process distribution atomically
  await prisma.$transaction(async (tx) => {
    // Mark contribution as allocated
    await tx.financialContribution.update({
      where: { id: contributionId },
      data: {
        status: "Allocated",
        allocatedBy: adminId,
        allocatedAt: new Date(),
        allocationNote: note,
      },
    });

    // Mark request as fulfilled
    await tx.donationRequest.update({
      where: { id: requestId },
      data: { status: "Fulfilled" },
    });

    // Notify donor
    await tx.notification.create({
      data: {
        userId: contribution.donorId,
        message: `Your contribution of ${amount} ${contribution.currency} has been distributed to a verified recipient. Thank you for making a difference!`,
      },
    });

    // Notify recipient
    await tx.notification.create({
      data: {
        userId: request.recipientId,
        message: `Your financial assistance request has been fulfilled. The Red Cross has allocated ${amount} ${contribution.currency} to your request. Note: ${note}.`,
      },
    });
  });
};