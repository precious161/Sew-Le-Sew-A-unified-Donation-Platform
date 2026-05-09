
import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/bloodMatchingService.js";
import { runInKindMatching } from "../../matching/inKindMatchingService.js";

export const registerIntent = async (userId, data) => {

 const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.identityStatus !== "Verified") {
    const error = new Error("Identity Verification Required. Please upload your National ID/Passport to register a donation.");
    error.statusCode = 403; // Forbidden
    throw error;
  }

  const { category, plannedDate, location, itemType, quantity } = data;

  // ── Category Guards ──
  if (category === "Financial") {
    const error = new Error(
      "To make a financial donation, please visit the financial contribution section."
    );
    error.statusCode = 400;
    throw error;
  }

  if (category === "Organ") {
    const error = new Error(
      "Organ donation intents are handled through our AI matching system. Please contact the Red Cross directly."
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
    const error = new Error("You are not eligible for this donation category. Please complete the eligibility check first.");
    error.statusCode = 403;
    throw error;
  }

  // 2. Check Cooldown
  if (eligibility.ineligibleUntil && eligibility.ineligibleUntil > new Date()) {
    const cooldownDate = eligibility.ineligibleUntil.toDateString();
    const error = new Error(
      `You are currently in a cooldown period. You will be eligible to donate again on ${cooldownDate}.`
    );
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
    const error = new Error(
      "You already have an active intent for this category. Please cancel it before registering a new one."
    );
    error.statusCode = 409;
    throw error;
  }

  // 4. Extra validation for In-Kind
  if (category === "In_Kind") {
    if (!itemType || !quantity) {
      const error = new Error(
        "itemType and quantity are required for In-Kind donations."
      );
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

  // 6. Notify donor that intent was registered
  await prisma.notification.create({
    data: {
      userId,
      message: `Your ${category} donation intent has been registered successfully. You are now in the active donor pool.`,
    },
  });

  // 7. Automatically trigger matching engine
  // Note: matching only finds Pending (admin-verified) requests
  if (category === "Blood") {
    try {
      await runBloodMatching();
    } catch (matchingError) {
      console.error("Blood matching engine error:", matchingError);
    }
  } else if (category === "In_Kind") {
    try {
      await runInKindMatching();
    } catch (matchingError) {
      console.error("In-Kind matching engine error:", matchingError);
    }
  }

  return newIntent;
};

// ─────────────────────────────────────────
// Cancel an active intent
// ─────────────────────────────────────────
export const cancelIntent = async (userId, intentId) => {
  const intent = await prisma.donationIntent.findUnique({
    where: { id: intentId },
  });

  if (!intent) {
    const error = new Error("Intent not found.");
    error.statusCode = 404;
    throw error;
  }

  if (intent.userId !== userId) {
    const error = new Error("You are not authorized to cancel this intent.");
    error.statusCode = 403;
    throw error;
  }

  if (intent.status !== "Active") {
    const error = new Error(
      `Only active intents can be cancelled. Current status: ${intent.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const cancelled = await prisma.donationIntent.update({
    where: { id: intentId },
    data: { status: "Cancelled" },
  });

  await prisma.notification.create({
    data: {
      userId,
      message: `Your ${intent.category} donation intent has been cancelled successfully.`,
    },
  });

  return cancelled;
};

// ─────────────────────────────────────────
// Get donor's own intents
// ─────────────────────────────────────────
export const getMyIntents = async (userId) => {
  return await prisma.donationIntent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};