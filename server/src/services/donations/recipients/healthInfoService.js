import prisma from "../../../config/db.js";

export const upsertHealthInfo = async (userId, data) => {
  // Upsert: Update if it exists, Create if it doesn't.
  return await prisma.healthInformation.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
};