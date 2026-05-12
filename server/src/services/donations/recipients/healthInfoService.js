import prisma from "../../../config/db.js";

export const getHealthInfoByUserId = async (userId) => {
  return await prisma.healthInformation.findUnique({
    where: { userId },
  });
};

export const upsertHealthInfo = async (userId, data) => {
  return await prisma.healthInformation.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
};