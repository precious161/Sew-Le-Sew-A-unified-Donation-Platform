
import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/blood/bloodMatchingService.js";

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

  // 2. Create the Request
  const newRequest = await prisma.donationRequest.create({
    data: {
      recipientId: userId,
      ...data,
      status: "Pending",
    },
  });

  // 3. Automatically trigger matching engine based on donation type
  if (newRequest.donationType === "Blood") {
    await runBloodMatching();
  }
  // In_Kind matching will be added here later
  // Organ matching will be handled in AI subsystem

  return newRequest;
};