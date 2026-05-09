
import prisma from "../../config/db.js";

// ─────────────────────────────────────────
// Helper: Get minimum amount from MedicalStandard
// ─────────────────────────────────────────
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
    throw new Error(
      "Financial minimum amount standard not found. Please seed the database."
    );
  }

  return parseFloat(standard.value);
};

// ─────────────────────────────────────────
// Donor: Submit a contribution pledge + proof of transfer
// ─────────────────────────────────────────
export const submitContribution = async (donorId, data) => {
  const { amount, currency, purpose, documentUrl } = data;

  // 1. Document required — proof of transfer
  if (!documentUrl) {
    const error = new Error(
      "Proof of transfer document is required. Please upload your bank or Telebirr transfer receipt."
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Fetch minimum amount from MedicalStandard
  const minAmount = await getMinimumAmount();

  if (amount < minAmount) {
    const error = new Error(
      `Minimum contribution amount is ${minAmount} ETB.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Create the contribution pledge
  const contribution = await prisma.financialContribution.create({
    data: {
      donorId,
      amount,
      currency: currency || "ETB",
      purpose: purpose || null,
      documentUrl,
      status: "Pending",
    },
  });

  // 4. Notify the donor
  await prisma.notification.create({
    data: {
      userId: donorId,
      message: `Your contribution pledge of ${amount} ${currency || "ETB"} has been submitted with your proof of transfer. The Red Cross will verify your payment shortly.`,
    },
  });

  return contribution;
};

// ─────────────────────────────────────────
// Donor: Cancel a pending contribution
// ─────────────────────────────────────────
export const cancelContribution = async (donorId, contributionId) => {
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.donorId !== donorId) {
    const error = new Error(
      "You are not authorized to cancel this contribution."
    );
    error.statusCode = 403;
    throw error;
  }

  if (contribution.status !== "Pending") {
    const error = new Error(
      `This contribution cannot be cancelled. Current status: ${contribution.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.financialContribution.update({
    where: { id: contributionId },
    data: { status: "Failed" },
  });

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
// Admin: Get all pending contributions
// ─────────────────────────────────────────
export const getPendingContributions = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [contributions, totalCount] = await Promise.all([
    prisma.financialContribution.findMany({
      skip,
      take: limit,
      where: { status: "Pending" },
      orderBy: { createdAt: "asc" },
      include: {
        donor: {
          select: {
            id: true,
            FirstName: true,
            LastName: true,
            EmailAddress: true,
            PhoneNumber: true,
          },
        },
      },
    }),
    prisma.financialContribution.count({
      where: { status: "Pending" },
    }),
  ]);

  return {
    contributions,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// ─────────────────────────────────────────
// Admin: Review a contribution (approve or reject)
// Replaces separate verifyContribution and rejectContribution
// ─────────────────────────────────────────
export const reviewContribution = async (adminId, contributionId, data) => {
  const { approved, rejectionReason } = data;

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
      `Only pending contributions can be reviewed. Current status: ${contribution.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  if (approved) {
    // ── APPROVED ──
    await prisma.financialContribution.update({
      where: { id: contributionId },
      data: {
        status: "Verified",
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: contribution.donorId,
        message: `Your contribution of ${contribution.amount} ${contribution.currency} has been verified by the Red Cross. Thank you for your generosity! Your funds will be allocated to verified recipients shortly.`,
      },
    });
  } else {
    // ── REJECTED ──
    if (!rejectionReason) {
      const error = new Error(
        "Rejection reason is required when rejecting a contribution."
      );
      error.statusCode = 400;
      throw error;
    }

    await prisma.financialContribution.update({
      where: { id: contributionId },
      data: {
        status: "Failed",
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason,
      },
    });

    await prisma.notification.create({
      data: {
        userId: contribution.donorId,
        message: `Your contribution pledge of ${contribution.amount} ${contribution.currency} could not be verified. Reason: ${rejectionReason}. Please contact the Red Cross for more information.`,
      },
    });
  }
};

// ─────────────────────────────────────────
// Admin: Allocate a verified contribution
// ─────────────────────────────────────────
export const allocateContribution = async (
  adminId,
  contributionId,
  allocationNote
) => {
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

  await prisma.notification.create({
    data: {
      userId: contribution.donorId,
      message: `Your contribution of ${contribution.amount} ${contribution.currency} has been allocated. Note: ${allocationNote}. Your donation is making a difference!`,
    },
  });

  return updated;
};

// ─────────────────────────────────────────
// Admin: Distribute funds to a verified recipient request
// ─────────────────────────────────────────
export const distributeToRecipient = async (
  adminId,
  contributionId,
  requestId,
  amount,
  note
) => {
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

  const request = await prisma.donationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    const error = new Error("Donation request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (request.donationType !== "Financial") {
    const error = new Error(
      "This request is not a financial donation request."
    );
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

  await prisma.$transaction(async (tx) => {
    await tx.financialContribution.update({
      where: { id: contributionId },
      data: {
        status: "Allocated",
        allocatedBy: adminId,
        allocatedAt: new Date(),
        allocationNote: note,
      },
    });

    await tx.donationRequest.update({
      where: { id: requestId },
      data: { status: "Fulfilled" },
    });

    await tx.notification.create({
      data: {
        userId: contribution.donorId,
        message: `Your contribution of ${amount} ${contribution.currency} has been distributed to a verified recipient. Thank you for making a difference!`,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.recipientId,
        message: `Your financial assistance request has been fulfilled. The Red Cross has allocated ${amount} ${contribution.currency} to your request. Note: ${note}.`,
      },
    });
  });
};