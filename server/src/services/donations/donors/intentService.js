// intentService.js
import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/blood/bloodMatchingService.js";
import { runInKindMatching } from "../../matching/inKind/inKindMatchingService.js";

export const registerIntent = async (userId, data) => {
  const { category, plannedDate, location, itemType, quantity } = data;

   if (category === "Financial") {
    const error = new Error(
      "To make a financial donation, please visit the financial contribution section to complete your transfer."
    );
    error.statusCode = 400;
    throw error;
  }

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

  // 4. Extra validation for In-Kind
  if (category === "In_Kind") {
    if (!itemType || !quantity) {
      const error = new Error("itemType and quantity are required for In-Kind donations.");
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Create the Intent
  const newIntent = await prisma.donationIntent.create({
    data: {
      userId,
      category,
      plannedDate,
      location: location || "Red Cross Center, Addis Ababa",
      status: "Active",
      itemType: category === "In_Kind" ? itemType : null,
      quantity: category === "In_Kind" ? quantity : null,
    },
  });

  // 6. Automatically trigger matching engine based on category
  if (category === "Blood") {
    await runBloodMatching();
  } else if (category === "In_Kind") {
    await runInKindMatching();
  }
  // Organ matching will be handled in AI subsystem

  return newIntent;
};