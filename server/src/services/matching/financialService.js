import prisma from "../../config/db.js";
import logger from "../../utils/logger.js";

// Helper function to get minimum contribution amount from MedicalStandard
const getMinimumAmount = async () => {
  const standard = await prisma.medicalStandard.findUnique({
    where: {
      category_ruleKey: {
        category: "Financial",
        ruleKey: "MIN_AMOUNT",
      },
    },
  });
  return standard ? parseFloat(standard.value) : 5;
};

// ─────────────────────────────────────────
// Check if donor is eligible to contribute
// ─────────────────────────────────────────
export const checkEligibility = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { identityStatus: true, Role: true }
  });

  const isVerified = user?.identityStatus === "Verified" && user?.Role === "Donor";

  logger.info(`Financial eligibility check`, { userId, isVerified });

  return {
    isVerified,
    role: user?.Role,
    identityStatus: user?.identityStatus
  };
};

// ─────────────────────────────────────────
// Donor: Submit a contribution pledge + proof of transfer
// ─────────────────────────────────────────
export const submitContribution = async (donorId, data) => {
  logger.info(`Financial contribution submission started`, { donorId });

  const currentUser = await prisma.user.findUnique({ where: { id: donorId } });
  if (!currentUser || currentUser.identityStatus !== "Verified") {
    logger.warn(`Financial contribution rejected - identity not verified`, { donorId });
    const error = new Error("Identity Verification Required. Due to Anti-Money Laundering (AML) policies, you must verify your National ID before making financial contributions.");
    error.statusCode = 403;
    throw error;
  }

  const { amount, currency, purpose, documentUrl } = data;

  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount)) {
    logger.warn(`Financial contribution rejected - invalid amount`, { donorId, amount });
    const error = new Error("Invalid amount provided. Please enter a valid number.");
    error.statusCode = 400;
    throw error;
  }

  if (!documentUrl) {
    logger.warn(`Financial contribution rejected - no proof document`, { donorId });
    const error = new Error("Proof of transfer document is required. Please upload your bank or Telebirr transfer receipt.");
    error.statusCode = 400;
    throw error;
  }

  const minAmount = await getMinimumAmount();

  if (parsedAmount < minAmount) {
    logger.warn(`Financial contribution rejected - amount below minimum`, { donorId, amount: parsedAmount, minAmount });
    const error = new Error(`Minimum contribution amount is ${minAmount} Birr.`);
    error.statusCode = 400;
    throw error;
  }

  // Create contribution with remainingAmount set to full amount
  const contribution = await prisma.financialContribution.create({
    data: {
      donorId,
      amount: parsedAmount,
      remainingAmount: parsedAmount, // ✅ Now this field exists
      currency: currency || "ETB",
      purpose: purpose || null,
      documentUrl,
      status: "Pending",
    },
  });

  await prisma.notification.create({
    data: {
      userId: donorId,
      message: `💰 Your contribution pledge of ${parsedAmount} Birr has been submitted with your proof of transfer. The Red Cross will verify your payment shortly.`,
    },
  });

  logger.info(`Financial contribution submitted successfully`, { donorId, contributionId: contribution.id, amount: parsedAmount });

  return contribution;
};

// ─────────────────────────────────────────
// Donor: Cancel a pending contribution
// ─────────────────────────────────────────
export const cancelContribution = async (donorId, contributionId) => {
  logger.info(`Financial contribution cancellation requested`, { donorId, contributionId });

  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    logger.warn(`Financial contribution not found for cancellation`, { donorId, contributionId });
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.donorId !== donorId) {
    logger.warn(`Unauthorized financial contribution cancellation attempt`, { donorId, contributionId });
    const error = new Error("Not authorized to cancel this contribution.");
    error.statusCode = 403;
    throw error;
  }

  if (contribution.status !== "Pending") {
    logger.warn(`Financial contribution cancellation rejected - wrong status`, { donorId, contributionId, status: contribution.status });
    const error = new Error(`Cannot cancel contribution with status: ${contribution.status}. Only pending contributions can be cancelled.`);
    error.statusCode = 400;
    throw error;
  }

  const cancelled = await prisma.financialContribution.update({
    where: { id: contributionId },
    data: { status: "Failed" },
  });

  await prisma.notification.create({
    data: {
      userId: donorId,
      message: `❌ Your contribution of ${contribution.amount} Birr has been cancelled.`,
    },
  });

  logger.info(`Financial contribution cancelled successfully`, { donorId, contributionId });

  return cancelled;
};

// ─────────────────────────────────────────
// Donor: Get my contributions
// ─────────────────────────────────────────
export const getMyContributions = async (donorId) => {
  logger.info(`Fetching donor contributions`, { donorId });
  return await prisma.financialContribution.findMany({
    where: { donorId },
    orderBy: { createdAt: "desc" },
  });
};

// ─────────────────────────────────────────
// Admin: Get all contributions (with pagination)
// ─────────────────────────────────────────
export const getAllContributions = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [contributions, totalCount] = await Promise.all([
    prisma.financialContribution.findMany({
      skip,
      take: limit,
      include: {
        donor: {
          select: {
            id: true,
            FirstName: true,
            LastName: true,
            EmailAddress: true,
          },
        },
        verifiedByUser: {
          select: {
            FirstName: true,
            LastName: true,
          },
        },
        allocatedByUser: {
          select: {
            FirstName: true,
            LastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.financialContribution.count(),
  ]);

  logger.info(`Admin fetched all contributions`, { count: contributions.length, page, totalCount });

  return { contributions, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

// ─────────────────────────────────────────
// Admin: Get pending contributions
// ─────────────────────────────────────────
export const getPendingContributions = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [contributions, totalCount] = await Promise.all([
    prisma.financialContribution.findMany({
      skip,
      take: limit,
      where: { status: "Pending" },
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
      orderBy: { createdAt: "asc" },
    }),
    prisma.financialContribution.count({ where: { status: "Pending" } }),
  ]);

  logger.info(`Admin fetched pending contributions`, { count: contributions.length, page, totalCount });

  return { contributions, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

// ─────────────────────────────────────────
// Admin: Review a contribution (approve or reject)
// ─────────────────────────────────────────
export const reviewContribution = async (adminId, contributionId, data) => {
  const { approved, rejectionReason } = data;

  logger.info(`Admin reviewing contribution`, { adminId, contributionId, approved });

  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    logger.warn(`Contribution not found for review`, { adminId, contributionId });
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.status !== "Pending") {
    logger.warn(`Contribution review rejected - wrong status`, { adminId, contributionId, status: contribution.status });
    const error = new Error(`Contribution has already been ${contribution.status.toLowerCase()}.`);
    error.statusCode = 400;
    throw error;
  }

  if (approved) {
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
        message: `✅ Your contribution of ${contribution.amount} Birr has been verified! Thank you for your support. The funds will now be allocated to verified recipients.`,
      },
    });

    logger.info(`Contribution approved`, { adminId, contributionId, donorId: contribution.donorId, amount: contribution.amount });
  } else {
    if (!rejectionReason) {
      logger.warn(`Contribution rejection missing reason`, { adminId, contributionId });
      const error = new Error("Rejection reason is required when rejecting a contribution.");
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
        message: `❌ Your contribution of ${contribution.amount} Birr could not be verified. Reason: ${rejectionReason}. Please contact support.`,
      },
    });

    logger.info(`Contribution rejected`, { adminId, contributionId, donorId: contribution.donorId, reason: rejectionReason });
  }
};

// ─────────────────────────────────────────
// Admin: Get verified contributions with remaining balance
// ─────────────────────────────────────────
export const getVerifiedContributions = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [contributions, totalCount] = await Promise.all([
    prisma.financialContribution.findMany({
      skip,
      take: limit,
      where: {
        status: "Verified",
        remainingAmount: { gt: 0 }
      },
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
      orderBy: { createdAt: "asc" },
    }),
    prisma.financialContribution.count({ where: { status: "Verified", remainingAmount: { gt: 0 } } }),
  ]);

  logger.info(`Admin fetched verified contributions`, { count: contributions.length, page, totalCount });

  return { contributions, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

// ─────────────────────────────────────────
// Admin: Distribute funds to a verified recipient request (with partial distribution)
// ─────────────────────────────────────────
export const distributeToRecipient = async (
  adminId,
  contributionId,
  requestId,
  amount,
  note
) => {
  logger.info(`Admin distributing funds`, { adminId, contributionId, requestId, amount });

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get contribution with lock
    const contribution = await tx.financialContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      const error = new Error("Contribution not found.");
      error.statusCode = 404;
      throw error;
    }

    if (contribution.status !== "Verified") {
      const error = new Error("Only verified contributions can be distributed.");
      error.statusCode = 400;
      throw error;
    }

    // Check if contribution has enough remaining balance
    const currentRemaining = contribution.remainingAmount !== undefined ? contribution.remainingAmount : contribution.amount;

    if (currentRemaining < amount) {
      const error = new Error(`Insufficient remaining balance. Available: ${currentRemaining} Birr, Requested: ${amount} Birr`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Get request
    const request = await tx.donationRequest.findUnique({
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
      const error = new Error(`This request has already been processed. Current status: ${request.status}.`);
      error.statusCode = 400;
      throw error;
    }

    // 3. Calculate new remaining amount
    const newRemainingAmount = currentRemaining - amount;
    const isFullyDistributed = newRemainingAmount === 0;

    // 4. Update contribution
    const updatedContribution = await tx.financialContribution.update({
      where: { id: contributionId },
      data: {
        remainingAmount: newRemainingAmount,
        status: isFullyDistributed ? "Allocated" : "Verified",
        allocatedBy: isFullyDistributed ? adminId : undefined,
        allocatedAt: isFullyDistributed ? new Date() : undefined,
        allocationNote: isFullyDistributed ? note : undefined,
      },
    });

    // 5. Update request status
    const updatedRequest = await tx.donationRequest.update({
      where: { id: requestId },
      data: { status: "Fulfilled" },
    });

    // 6. Create donation history
    await tx.donationHistory.create({
      data: {
        donorId: contribution.donorId,
        donationType: "Financial",
        quantity: amount,
        location: "Digital Transfer",
        remarks: `Successfully contributed ${amount} Birr. ${isFullyDistributed ? 'Full contribution distributed.' : `Remaining balance: ${newRemainingAmount} Birr.`} Note: ${note}`,
        donationDate: new Date(),
        status: "Completed",
      }
    });

    // 7. Create notifications
    const donorMessage = isFullyDistributed
      ? `🎉 Your contribution of ${contribution.amount} Birr has been fully distributed and added to your Donation History. Thank you for making a difference!`
      : `📋 ${amount} Birr from your contribution has been distributed to a verified recipient. Remaining balance: ${newRemainingAmount} Birr.`;

    await tx.notification.create({
      data: {
        userId: contribution.donorId,
        message: donorMessage,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.recipientId,
        message: `🎉 Your financial assistance request for ${amount} Birr has been fulfilled. Note: ${note}.`,
      },
    });

    return { updatedContribution, updatedRequest, isFullyDistributed, newRemainingAmount };
  });

  logger.info(`Funds distributed successfully`, {
    adminId,
    contributionId,
    requestId,
    amount,
    remainingBalance: result.newRemainingAmount,
    isFullyDistributed: result.isFullyDistributed
  });

  return result;
};

// ─────────────────────────────────────────
// Get contribution details with distribution history
// ─────────────────────────────────────────
export const getContributionDetails = async (contributionId) => {
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
    include: {
      donor: {
        select: {
          id: true,
          FirstName: true,
          LastName: true,
          EmailAddress: true,
        },
      },
      verifiedByUser: true,
      allocatedByUser: true,
    },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  const distributions = await prisma.donationHistory.findMany({
    where: { donorId: contribution.donorId, donationType: "Financial" },
    orderBy: { donationDate: "desc" },
  });

  return {
    ...contribution,
    distributedTotal: contribution.amount - (contribution.remainingAmount || contribution.amount),
    distributions,
  };
};