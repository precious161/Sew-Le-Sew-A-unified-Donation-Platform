// donationRequestService.js
import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/blood/bloodMatchingService.js";
import { runInKindMatching } from "../../matching/inKind/inKindMatchingService.js";

export const createDonationRequest = async (userId, data) => {
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

  // 2. Extra validation for In-Kind
  if (data.donationType === "In_Kind") {
    if (!data.itemType || !data.itemQuantity) {
      const error = new Error("itemType and itemQuantity are required for In-Kind requests.");
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Create the Request
  const newRequest = await prisma.donationRequest.create({
    data: {
      recipientId: userId,
      ...data,
      status: "Pending",
    },
  });

  // 4. Automatically trigger matching engine based on donation type
  if (newRequest.donationType === "Blood") {
    await runBloodMatching();
  } else if (newRequest.donationType === "In_Kind") {
    await runInKindMatching();
  }
  // Organ matching will be handled in AI subsystem

  return newRequest;
};