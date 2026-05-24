import prisma from "../../config/db.js";

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

  return {
    isVerified: user?.identityStatus === "Verified" && user?.Role === "Donor",
    role: user?.Role,
    identityStatus: user?.identityStatus
  };
};

// ─────────────────────────────────────────
// Donor: Submit a contribution pledge + proof of transfer
// ─────────────────────────────────────────
export const submitContribution = async (donorId, data) => {
  const currentUser = await prisma.user.findUnique({ where: { id: donorId } });
  if (!currentUser || currentUser.identityStatus !== "Verified") {
    const error = new Error("Identity Verification Required. Due to Anti-Money Laundering (AML) policies, you must verify your National ID before making financial contributions.");
    error.statusCode = 403;
    throw error;
  }

  const { amount, currency, purpose, documentUrl } = data;

  // FIX: Parse amount as float (Prisma expects Float, not String)
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount)) {
    const error = new Error("Invalid amount provided. Please enter a valid number.");
    error.statusCode = 400;
    throw error;
  }

  if (!documentUrl) {
    const error = new Error("Proof of transfer document is required. Please upload your bank or Telebirr transfer receipt.");
    error.statusCode = 400;
    throw error;
  }

  const minAmount = await getMinimumAmount();

  if (parsedAmount < minAmount) {
    const error = new Error(`Minimum contribution amount is ${minAmount} Birr.`);
    error.statusCode = 400;
    throw error;
  }

  const contribution = await prisma.financialContribution.create({
    data: {
      donorId,
      amount: parsedAmount,
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
    const error = new Error("Not authorized to cancel this contribution.");
    error.statusCode = 403;
    throw error;
  }

  if (contribution.status !== "Pending") {
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

  return cancelled;
};

// ─────────────────────────────────────────
// Donor: Get my contributions
// ─────────────────────────────────────────
export const getMyContributions = async (donorId) => {
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

  return { contributions, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page };
};

// ─────────────────────────────────────────
// Admin: Review a contribution (approve or reject)
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
  } else {
    if (!rejectionReason) {
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
  }
};

// ─────────────────────────────────────────
// Admin: Allocate a verified contribution
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
    const error = new Error(`Only verified contributions can be allocated. Current status: ${contribution.status}.`);
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
      message: `📋 Your contribution of ${contribution.amount} Birr has been allocated to a verified medical need. Thank you for making a difference!`,
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
    const error = new Error("Only verified contributions can be distributed.");
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
    const error = new Error("This request is not a financial donation request.");
    error.statusCode = 400;
    throw error;
  }

  if (request.status !== "Pending") {
    const error = new Error(`This request has already been processed. Current status: ${request.status}.`);
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

    await tx.donationHistory.create({
      data: {
        donorId: contribution.donorId,
        donationType: "Financial",
        quantity: amount,
        location: "Digital Transfer",
        remarks: `Successfully contributed ${amount} Birr. Funds were distributed to a verified patient. Note: ${note}`,
        donationDate: new Date(),
        status: "Completed",
      }
    });

    await tx.notification.create({
      data: {
        userId: contribution.donorId,
        message: `🎉 Your contribution of ${amount} Birr has been distributed to a verified recipient and added to your Donation History. Thank you for making a difference!`,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.recipientId,
        message: `🎉 Your financial assistance request has been fulfilled. The Red Cross has allocated ${amount} Birr to your request. Note: ${note}.`,
      },
    });
  });
};