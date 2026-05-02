
import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/blood/bloodMatchingService.js";

export const registerIntent = async (userId, data) => {
  const { category, plannedDate, location, itemType, quantity } = data;

  // 1. Check Eligibility Status
  const eligibility = await prisma.userEligibilityStatus.findUnique({
    where: {
      userId_category: {
        userId,
        category,
      },
    },
  });

  if (!eligibility || eligibility.status !== "Eligible") {
    const error = new Error("User is not eligible for this donation category.");
    error.statusCode = 403;
    throw error;
  }

  // 2. Check Cooldown
  if (eligibility.ineligibleUntil && eligibility.ineligibleUntil > new Date()) {
    const error = new Error("User is currently in a cooldown period.");
    error.statusCode = 403;
    throw error;
  }

  // 3. Check for existing active/matched intent
  const existingIntent = await prisma.donationIntent.findFirst({
    where: {
      userId,
      category,
      status: { in: ["Active", "Matched"] },
    },
  });

  if (existingIntent) {
    const error = new Error("You already have an active intent for this category.");
    error.statusCode = 409;
    throw error;
  }

  // 4. Create the Intent
  const newIntent = await prisma.donationIntent.create({
    data: {
      userId,
      category,
      plannedDate,
      location: location || "Red Cross Center, Addis Ababa",
      status: "Active",
      // In-Kind specific fields — ignored for other categories
      itemType: category === "In_Kind" ? itemType : null,
      quantity: category === "In_Kind" ? quantity : null,
    },
  });

  // 5. Automatically trigger matching engine based on category
  if (category === "Blood") {
    await runBloodMatching();
  }
  // In_Kind matching will be added here later
  // Organ matching will be handled in AI subsystem

  return newIntent;
};