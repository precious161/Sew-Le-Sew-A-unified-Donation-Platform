import prisma from "../../../config/db.js";

export const registerIntent = async (userId, data) => {
  const { category, plannedDate, location } = data;

  // 1. Check Eligibility Status
  // Using the composite ID we defined in the schema: @@id([userId, category])
  const eligibility = await prisma.userEligibilityStatus.findUnique({
    where: {
      userId_category: {
        userId,
        category,
      },
    },
  });

  // Precondition: Must have an eligibility record and it must be 'Eligible'
  if (!eligibility || eligibility.status !== 'Eligible') {
    const error = new Error('User is not eligible for this donation category.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Check Cooldown (Safety check for recurring donors)
  if (eligibility.ineligibleUntil && eligibility.ineligibleUntil > new Date()) {
    const error = new Error('User is currently in a cooldown period.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Check for existing active/matched intent
  // We use findFirst because @@unique handles the DB level, but we want a clean error here
  const existingIntent = await prisma.donationIntent.findFirst({
    where: {
      userId,
      category,
      status: { in: ['Active', 'Matched'] },
    },
  });

  if (existingIntent) {
    const error = new Error('You already have an active intent for this category.');
    error.statusCode = 409;
    throw error;
  }

  // 4. Create the Intent (Adding them to the "Active Pool")
  return await prisma.donationIntent.create({
    data: {
      userId,
      category,
      plannedDate,
      location: location || "Red Cross Center, Addis Ababa",
      status: 'Active',
    },
  });
};