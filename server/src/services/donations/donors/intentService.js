import prisma from "../../../config/db.js";
import { runBloodMatching } from "../../matching/bloodMatchingService.js";
import { runInKindMatching } from "../../matching/inKindMatchingService.js";

export const registerIntent = async (userId, data) => {
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.identityStatus !== "Verified") {
    const error = new Error("Identity Verification Required. Please upload your National ID/Passport to register a donation.");
    error.statusCode = 403;
    throw error;
  }

  // --- CHANGED: Added documentUrl ---
  const { category, plannedDate, location, itemType, quantity, documentUrl } = data;

  if (category === "Financial") {
    const error = new Error("To make a financial donation, please visit the financial contribution section.");
    error.statusCode = 400;
    throw error;
  }

  // --- NEW: Organ Medical Document Guard ---
  if (category === "Organ" && !documentUrl) {
    const error = new Error("A Medical Clearance document is required to register as an Organ Donor.");
    error.statusCode = 400;
    throw error;
  }

  // 1. Check Eligibility Status
  const eligibility = await prisma.userEligibilityStatus.findUnique({
    where: { userId_category: { userId, category } },
  });

  if (!eligibility || eligibility.status !== "Eligible") {
    const error = new Error("You are not eligible for this donation category. Please complete the eligibility check first.");
    error.statusCode = 403;
    throw error;
  }

  // 2. Check Cooldown
  if (eligibility.ineligibleUntil && eligibility.ineligibleUntil > new Date()) {
    const cooldownDate = eligibility.ineligibleUntil.toDateString();
    const error = new Error(`You are currently in a cooldown period. You will be eligible to donate again on ${cooldownDate}.`);
    error.statusCode = 403;
    throw error;
  }

  // 3. Check for existing active/matched/pending intent
  const existingIntent = await prisma.donationIntent.findFirst({
    where: { userId, category, status: { in: ["Active", "Matched", "PendingVerification"] } },
  });

  if (existingIntent) {
    const error = new Error("You already have an active or pending intent for this category. Please cancel it before registering a new one.");
    error.statusCode = 409;
    throw error;
  }

  // 4. Extra validation for In-Kind & Organ
  if (category === "In_Kind" || category === "Organ") {
    if (!itemType) {
      const error = new Error("itemType is required for In-Kind and Organ donations.");
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
      // --- CHANGED: Organs go to PendingVerification ---
      status: category === "Organ" ? "PendingVerification" : "Active",
      itemType: (category === "In_Kind" || category === "Organ") ? itemType : null,
      quantity: (category === "In_Kind" || category === "Organ") ? quantity : null,
      documentUrl: documentUrl || null,
    },
  });

  // 6. Notify donor
  if (category === "Organ") {
    await prisma.notification.create({
      data: { userId, message: `Your Organ Donation intent is under medical review by the Red Cross. You will be notified once verified.` },
    });
  } else {
    await prisma.notification.create({
      data: { userId, message: `Your ${category} donation intent has been registered successfully. You are now in the active donor pool.` },
    });
  }

  // 7. Automatically trigger matching engine (Notice we do NOT trigger Organ here yet)
  if (category === "Blood") {
    try { await runBloodMatching(); } catch (error) { console.error(error); }
  } else if (category === "In_Kind") {
    try { await runInKindMatching(); } catch (error) { console.error(error); }
  }

  return newIntent;
};

// --- NEW: Admin verifies the Donor's Organ Intent ---
export const verifyDonorIntent = async (adminId, intentId, data) => {
  const { approved, rejectionReason } = data;
  const intent = await prisma.donationIntent.findUnique({ where: { id: intentId } });

  if (!intent || intent.status !== "PendingVerification") {
    const error = new Error("Intent not found or not pending verification.");
    error.statusCode = 400; throw error;
  }

  if (approved) {
    await prisma.donationIntent.update({
      where: { id: intentId },
      data: { status: "Active", verifiedBy: adminId, verifiedAt: new Date() },
    });

    await prisma.notification.create({
      data: { userId: intent.userId, message: `Your Organ Donation intent has been medically verified! You are now in the active matching pool.` },
    });

    // Trigger Organ Matching AFTER verification!
    const { runOrganMatching } = await import("../../matching/organ/organMatchingService.js");
    runOrganMatching().catch(console.error);
  } else {
    await prisma.donationIntent.update({
      where: { id: intentId },
      data: { status: "Cancelled", verifiedBy: adminId, verifiedAt: new Date(), rejectionReason },
    });

    await prisma.notification.create({
      data: { userId: intent.userId, message: `Your Organ Donation intent could not be verified. Reason: ${rejectionReason}` },
    });
  }
};

export const cancelIntent = async (userId, intentId) => {
  const intent = await prisma.donationIntent.findUnique({ where: { id: intentId } });
  if (!intent) { const error = new Error("Intent not found."); error.statusCode = 404; throw error; }
  if (intent.userId !== userId) { const error = new Error("Not authorized."); error.statusCode = 403; throw error; }

  if (!["Active", "PendingVerification"].includes(intent.status)) {
    const error = new Error(`Cannot cancel intent with status: ${intent.status}.`);
    error.statusCode = 400; throw error;
  }

  const cancelled = await prisma.donationIntent.update({ where: { id: intentId }, data: { status: "Cancelled" }});
  await prisma.notification.create({ data: { userId, message: `Your ${intent.category} donation intent has been cancelled.` }});
  return cancelled;
};

export const getMyIntents = async (userId) => {
  return await prisma.donationIntent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }});
};