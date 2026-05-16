// ─────────────────────────────────────────
// Donor: Submit a contribution pledge + proof of transfer
// ─────────────────────────────────────────
export const submitContribution = async (donorId, data) => {
  // ── 1. SECURITY GUARD: Identity Verification (KYC/AML) ──
  const currentUser = await prisma.user.findUnique({ where: { id: donorId } });
  if (!currentUser || currentUser.identityStatus !== "Verified") {
    const error = new Error("Identity Verification Required. Due to Anti-Money Laundering (AML) policies, you must verify your National ID before making financial contributions.");
    error.statusCode = 403; // Forbidden
    throw error;
  }

  const { amount, currency, purpose, documentUrl } = data;

  // 2. Document required — proof of transfer
  if (!documentUrl) {
    const error = new Error(
      "Proof of transfer document is required. Please upload your bank or Telebirr transfer receipt."
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Fetch minimum amount from MedicalStandard
  const minAmount = await getMinimumAmount();

  if (amount < minAmount) {
    const error = new Error(
      `Minimum contribution amount is ${minAmount} ${currency || "ETB"}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Create the contribution pledge
  const contribution = await prisma.financialContribution.create({
    data: {
      donorId,
      amount,
      currency: currency || "ETB",
      purpose: purpose || null,
      documentUrl,
      status: "Pending",
    },
  });

  // 5. Notify the donor
  await prisma.notification.create({
    data: {
      userId: donorId,
      message: `Your contribution pledge of ${amount} ${currency || "ETB"} has been submitted with your proof of transfer. The Red Cross will verify your payment shortly.`,
    },
  });

  return contribution;
};


// ─────────────────────────────────────────
// Admin: Distribute funds to a verified recipient request
// ─────────────────────────────────────────
export const distributeToRecipient = async (
  adminId,
  contributionId,
  requestId,
  amount,
  note
) => {
  const contribution = await prisma.financialContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    const error = new Error("Contribution not found.");
    error.statusCode = 404;
    throw error;
  }

  if (contribution.status !== "Verified") {
    const error = new Error("Only verified contributions can be distributed.");
    error.statusCode = 400;
    throw error;
  }

  const request = await prisma.donationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    const error = new Error("Donation request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (request.donationType !== "Financial") {
    const error = new Error("This request is not a financial donation request.");
    error.statusCode = 400;
    throw error;
  }

  if (request.status !== "Pending") {
    const error = new Error(`This request has already been processed. Current status: ${request.status}.`);
    error.statusCode = 400;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update Contribution & Request
    await tx.financialContribution.update({
      where: { id: contributionId },
      data: {
        status: "Allocated",
        allocatedBy: adminId,
        allocatedAt: new Date(),
        allocationNote: note,
      },
    });

    await tx.donationRequest.update({
      where: { id: requestId },
      data: { status: "Fulfilled" },
    });

    // 2. --- NEW: ADD TO DONATION HISTORY ---
    // Financial donations don't use the Match table, so we leave matchId blank
    await tx.donationHistory.create({
      data: {
        donorId: contribution.donorId,
        donationType: "Financial",
        quantity: amount, // We store the amount in the quantity field for history
        location: "Digital Transfer",
        remarks: `Successfully contributed ${amount} ${contribution.currency}. Funds were distributed to a verified patient. Note: ${note}`,
      }
    });

    // 3. Notifications
    await tx.notification.create({
      data: {
        userId: contribution.donorId,
        message: `Your contribution of ${amount} ${contribution.currency} has been distributed to a verified recipient and added to your Donation History. Thank you for making a difference!`,
      },
    });

    await tx.notification.create({
      data: {
        userId: request.recipientId,
        message: `Your financial assistance request has been fulfilled. The Red Cross has allocated ${amount} ${contribution.currency} to your request. Note: ${note}.`,
      },
    });
  });
};