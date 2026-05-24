import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/bloodMatchingService.js";
import { runInKindMatching } from "../../matching/inKindMatchingService.js";

export const createDonationRequest = async (userId, data) => {
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.identityStatus !== "Verified") {
    const error = new Error("Identity Verification Required. Please upload your National ID/Passport to make a donation request.");
    error.statusCode = 403;
    throw error;
  }

  const {
    donationType,
    requiredBloodType,
    organType,
    quantity,
    urgencyLevel,
    notes,
    itemType,
    itemQuantity,
    hospitalName,
    attendingDoctor,
    documentUrl,
    financialAmount,
    financialPurpose,
    bankName,
    bankAccount,
  } = data;

  const healthInfo = await prisma.healthInformation.findUnique({
    where: { userId },
  });

  if (!healthInfo) {
    const error = new Error(
      "❌ Health Information Required: Please complete your medical profile (blood type, weight, height, medical conditions) before submitting a donation request. This information is essential for matching you with compatible donors."
    );
    error.statusCode = 403;
    throw error;
  }

  if (donationType === "Blood" && !requiredBloodType) {
    const error = new Error(
      "Required blood type must be provided for Blood donation requests. Please select your blood type from the options."
    );
    error.statusCode = 400;
    throw error;
  }

  if (donationType === "In_Kind") {
    if (!itemType || !itemQuantity) {
      const error = new Error(
        "Item type and quantity are required for In-Kind requests. Please specify what medical supplies you need and the quantity."
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (donationType === "Organ" && !organType) {
    const error = new Error(
      "Organ type is required for Organ donation requests. Please specify which organ you need for transplant."
    );
    error.statusCode = 400;
    throw error;
  }

  if (!documentUrl) {
    const error = new Error(
      "📄 Medical Document Required: Please upload a supporting medical document (doctor's prescription, medical report, or hospital referral) to verify your donation request."
    );
    error.statusCode = 400;
    throw error;
  }

  if (!hospitalName) {
    const error = new Error(
      "Hospital name is required. Please specify the hospital where you are receiving treatment or where the donation should be delivered."
    );
    error.statusCode = 400;
    throw error;
  }

  if (!attendingDoctor) {
    const error = new Error(
      "Attending doctor's name is required. This helps us verify the medical necessity of your request."
    );
    error.statusCode = 400;
    throw error;
  }

  if (donationType === "Financial") {
    const parsedAmount = parseFloat(financialAmount);
    if (isNaN(parsedAmount) || parsedAmount < 100) {
       const error = new Error(`Minimum financial aid request is 100 Birr. Received: ${financialAmount}`);
      error.statusCode = 400;
      throw error;
    }
    if (!bankAccount) {
      const error = new Error("Bank account is required for fund transfer.");
      error.statusCode = 400;
      throw error;
    }
  }

  const newRequest = await prisma.donationRequest.create({
    data: {
      recipientId: userId,
      donationType,
      requiredBloodType: requiredBloodType || null,
      organType: organType || null,
      quantity: donationType === "Financial" ? (parseFloat(financialAmount) || 1) : (quantity || 1),
      urgencyLevel: urgencyLevel || "Medium",
      notes: donationType === "Financial" ? (financialPurpose || notes) : (notes || null),
      itemType: itemType || null,
      itemQuantity: itemQuantity || null,
      hospitalName: hospitalName || null,
      attendingDoctor: attendingDoctor || null,
      documentUrl,
      originalUrgency: urgencyLevel || "Medium",
      status: "PendingVerification",
      financialAmount: donationType === "Financial" ? parseFloat(financialAmount) : null,
      financialPurpose: donationType === "Financial" ? (financialPurpose || null) : null,
      bankName: donationType === "Financial" ? bankName : null,
      bankAccount: donationType === "Financial" ? bankAccount : null,
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      message: `📋 Your ${donationType} donation request has been submitted successfully. Request ID: ${newRequest.id.substring(0,8)}. It is currently under review by the Red Cross medical team. You will be notified once verified.`,
    },
  });

  return newRequest;
};

export const cancelDonationRequest = async (userId, requestId) => {
  const request = await prisma.donationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    const error = new Error("Donation request not found. Please check the request ID and try again.");
    error.statusCode = 404;
    throw error;
  }

  if (request.recipientId !== userId) {
    const error = new Error("You are not authorized to cancel this request. Only the recipient who created the request can cancel it.");
    error.statusCode = 403;
    throw error;
  }

  if (!["PendingVerification", "Pending"].includes(request.status)) {
    const error = new Error(
      `This request cannot be cancelled because it is already ${request.status === "Matching" ? "in the matching process" : request.status === "Fulfilled" ? "completed" : request.status === "Cancelled" ? "cancelled" : "being processed"}. Please contact the Red Cross for assistance.`
    );
    error.statusCode = 400;
    throw error;
  }

  const cancelled = await prisma.donationRequest.update({
    where: { id: requestId },
    data: { status: "Cancelled" },
  });

  await prisma.notification.create({
    data: {
      userId,
      message: `✅ Your ${request.donationType} donation request has been cancelled successfully. Request ID: ${request.id.substring(0,8)}`,
    },
  });

  return cancelled;
};

export const verifyDonationRequest = async (adminId, requestId, data) => {
  const {
    approved,
    correctedUrgencyLevel,
    correctedItemQuantity,
    rejectionReason,
  } = data;

  const request = await prisma.donationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    const error = new Error("Donation request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== "PendingVerification") {
    const error = new Error(
      `Only requests pending verification can be reviewed. Current status: ${request.status}. Please refresh the page and try again.`
    );
    error.statusCode = 400;
    throw error;
  }

  if (approved) {
    const finalUrgency = correctedUrgencyLevel || request.urgencyLevel;
    const finalQuantity = correctedItemQuantity || request.itemQuantity;

    const urgencyCorrected = correctedUrgencyLevel && correctedUrgencyLevel !== request.urgencyLevel;
    const quantityCorrected = correctedItemQuantity && correctedItemQuantity !== request.itemQuantity;

    await prisma.donationRequest.update({
      where: { id: requestId },
      data: {
        status: "Pending",
        urgencyLevel: finalUrgency,
        itemQuantity: finalQuantity,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
    });

    let approvalMessage = `✅ Your ${request.donationType} donation request has been approved`;

    if (urgencyCorrected || quantityCorrected) {
      approvalMessage += ` with the following adjustments:`;
      if (urgencyCorrected) {
        approvalMessage += ` Urgency level adjusted from ${request.originalUrgency} to ${finalUrgency}.`;
      }
      if (quantityCorrected) {
        approvalMessage += ` Item quantity adjusted from ${request.itemQuantity} to ${finalQuantity}.`;
      }
    } else {
      approvalMessage += ` and is now in the matching queue. You will be notified when a compatible donor is found.`;
    }

    await prisma.notification.create({
      data: {
        userId: request.recipientId,
        message: approvalMessage,
      },
    });

    if (request.donationType === "Blood") {
      try {
        await runBloodMatching();
      } catch (matchingError) {
        console.error("Blood matching engine error after verification:", matchingError);
      }
    } else if (request.donationType === "In_Kind") {
      try {
        await runInKindMatching();
      } catch (matchingError) {
        console.error("In-Kind matching engine error after verification:", matchingError);
      }
    }
  } else {
    if (!rejectionReason) {
      const error = new Error("Rejection reason is required when rejecting a donation request. Please specify why the request cannot be approved.");
      error.statusCode = 400;
      throw error;
    }

    await prisma.donationRequest.update({
      where: { id: requestId },
      data: {
        status: "Cancelled",
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason,
      },
    });

    await prisma.notification.create({
      data: {
        userId: request.recipientId,
        message: `❌ Your ${request.donationType} donation request has been reviewed and could not be approved. Reason: ${rejectionReason}. Please contact the Red Cross for more information or to appeal this decision.`,
      },
    });
  }
};

export const getPendingVerificationRequests = async (page = 1, limit = 20, additionalWhere = {}) => {
  const skip = (page - 1) * limit;

  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: {
        status: "PendingVerification",
        ...additionalWhere
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
        status: "PendingVerification",
        ...additionalWhere
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

export const getApprovedFinancialRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: {
        donationType: "Financial",
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
        donationType: "Financial",
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

export const getMyRequests = async (userId) => {
  return await prisma.donationRequest.findMany({
    where: { recipientId: userId },
    include: { matches: true },
    orderBy: { requestDate: "desc" },
  });
};