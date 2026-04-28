import prisma from "../../../config/db.js";

export const createDonationRequest = async (userId, data) => {
  // 1. Verify Precondition: Does the user have Health Information?
  const healthInfo = await prisma.healthInformation.findUnique({
    where: { userId }
  });

  if (!healthInfo) {
    const error = new Error('You must submit your health information before requesting a donation.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Create the Request
  return await prisma.donationRequest.create({
    data: {
      recipientId: userId,
      ...data,
      status: 'Pending',
    },
  });
};