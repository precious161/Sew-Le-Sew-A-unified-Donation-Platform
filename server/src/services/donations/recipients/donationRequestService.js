import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/bloodMatchingService.js";
import { runInKindMatching } from "../../matching/inKindMatchingService.js";

export const createDonationRequest = async (userId, data) => {
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.identityStatus !== "Verified") {
    const error = new Error("Identity Verification Required. Please upload your National ID/Passport to make a request.");
    error.statusCode = 403; // Forbidden
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
  } = data;


  // 1. Verify Precondition: Does the user have Health Information?
  const healthInfo = await prisma.healthInformation.findUnique({
    where: { userId },
  });

  if (!healthInfo) {
    const error = new Error(
      "You must submit your health information before requesting a donation."
    );
    error.statusCode = 403;
    throw error;
  }

  // 2. Blood specific validation
  if (donationType === "Blood" && !requiredBloodType) {
    const error = new Error(
      "Required blood type must be provided for Blood donation requests."
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. In-Kind specific validation
  if (donationType === "In_Kind") {
    if (!itemType || !itemQuantity) {
      const error = new Error(
        "itemType and itemQuantity are required for In-Kind requests."
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Document required for all requests
  if (!documentUrl) {
    const error = new Error(
      "A supporting medical document is required for all donation requests."
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Create the Request
  const newRequest = await prisma.donationRequest.create({
    data: {
      recipientId: userId,
      donationType,
      requiredBloodType: requiredBloodType || null,
      organType: organType || null,
      quantity: quantity || 1,
      urgencyLevel: urgencyLevel || "Medium",
      notes: notes || null,
      itemType: itemType || null,
      itemQuantity: itemQuantity || null,
      hospitalName: hospitalName || null,
      attendingDoctor: attendingDoctor || null,
      documentUrl,
      originalUrgency: urgencyLevel || "Medium",
      status: "PendingVerification",
    },
  });

  // 6. Notify recipient
  await prisma.notification.create({
    data: {
      userId,
      message: `Your ${donationType} donation request has been submitted and is currently under review by the Red Cross. You will be notified once verified.`,
    },
  });

  return newRequest;
};

// ─────────────────────────────────────────
// Recipient: Cancel a donation request
// ─────────────────────────────────────────
export const cancelDonationRequest = async (userId, requestId) => {
  const request = await prisma.donationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    const error = new Error("Donation request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (request.recipientId !== userId) {
    const error = new Error(
      "You are not authorized to cancel this request."
    );
    error.statusCode = 403;
    throw error;
  }

  if (!["PendingVerification", "Pending"].includes(request.status)) {
    const error = new Error(
      `This request cannot be cancelled. Current status: ${request.status}.`
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
      message: `Your ${request.donationType} donation request has been cancelled successfully.`,
    },
  });

  return cancelled;
};

// ─────────────────────────────────────────
// Admin: Verify a donation request
// ─────────────────────────────────────────
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
      `Only requests pending verification can be reviewed. Current status: ${request.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  if (approved) {
    const finalUrgency = correctedUrgencyLevel || request.urgencyLevel;
    const finalQuantity = correctedItemQuantity || request.itemQuantity;

    const urgencyCorrected =
      correctedUrgencyLevel &&
      correctedUrgencyLevel !== request.urgencyLevel;

    const quantityCorrected =
      correctedItemQuantity &&
      correctedItemQuantity !== request.itemQuantity;

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

    let approvalMessage = `Your ${request.donationType} donation request has been approved`;

    if (urgencyCorrected || quantityCorrected) {
      approvalMessage += ` with the following adjustments:`;
      if (urgencyCorrected) {
        approvalMessage += ` Urgency level adjusted from ${request.originalUrgency} to ${finalUrgency}.`;
      }
      if (quantityCorrected) {
        approvalMessage += ` Item quantity adjusted from ${request.itemQuantity} to ${finalQuantity}.`;
      }
    } else {
      approvalMessage += ` and is now in the matching queue. You will be notified when a donor is found.`;
    }

    await prisma.notification.create({
      data: {
        userId: request.recipientId,
        message: approvalMessage,
      },
    });

    // Trigger matching engine after verification
    if (request.donationType === "Blood") {
      try {
        await runBloodMatching();
      } catch (matchingError) {
        console.error(
          "Blood matching engine error after verification:",
          matchingError
        );
      }
    } else if (request.donationType === "In_Kind") {
      try {
        await runInKindMatching();
      } catch (matchingError) {
        console.error(
          "In-Kind matching engine error after verification:",
          matchingError
        );
      }
    }
  } else {
    if (!rejectionReason) {
      const error = new Error(
        "Rejection reason is required when rejecting a request."
      );
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
        message: `Your ${request.donationType} donation request has been reviewed and could not be approved. Reason: ${rejectionReason}. Please contact the Red Cross for more information.`,
      },
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get all requests pending verification
// ─────────────────────────────────────────
export const getPendingVerificationRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [requests, totalCount] = await Promise.all([
    prisma.donationRequest.findMany({
      skip,
      take: limit,
      where: { status: "PendingVerification" },
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
      where: { status: "PendingVerification" },
    }),
  ]);

  return {
    requests,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};