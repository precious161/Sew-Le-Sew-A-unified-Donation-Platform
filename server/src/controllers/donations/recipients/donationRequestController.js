import * as DonationRequestService from "../../../services/donations/recipients/donationRequestService.js";
import * as AuditService from "../../../services/security/auditService.js";

// ─────────────────────────────────────────
// Recipient: Submit a donation request
// ─────────────────────────────────────────
export const requestDonation = async (req, res) => {
  try {
    const userId = req.user.id;

    // Log what we received
    console.log('=== DONATION REQUEST CONTROLLER ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('financialAmount from body:', req.body.financialAmount);
    console.log('bankAccount from body:', req.body.bankAccount);

    // Merge body data with documentUrl from Cloudinary
    const data = {
      donationType: req.body.donationType,
      urgencyLevel: req.body.urgencyLevel,
      hospitalName: req.body.hospitalName,
      attendingDoctor: req.body.attendingDoctor,
      notes: req.body.notes,
      requiredBloodType: req.body.requiredBloodType,
      organType: req.body.organType,
      itemType: req.body.itemType,
      itemQuantity: req.body.itemQuantity,
      // Financial fields
      financialAmount: req.body.financialAmount,
      financialPurpose: req.body.financialPurpose,
      bankAccount: req.body.bankAccount,
      bankName: req.body.bankName,
      quantity: req.body.quantity,
      // Document from file upload
      documentUrl: req.file?.path || null,
    };

    console.log('Combined data for service:', data);

    const request = await DonationRequestService.createDonationRequest(userId, data);

    return res.status(201).json({
      success: true,
      message: "Donation request submitted successfully. It is currently under review by the Red Cross. You will be notified once verified.",
      data: request,
    });
  } catch (error) {
    console.error("requestDonation Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// ─────────────────────────────────────────
// Recipient: Cancel a donation request
// ─────────────────────────────────────────
export const cancelDonationRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cancelled = await DonationRequestService.cancelDonationRequest(userId, id);

    return res.status(200).json({
      success: true,
      message: "Donation request cancelled successfully.",
      data: cancelled,
    });
  } catch (error) {
    console.error("cancelDonationRequest Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to cancel donation request.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get all requests pending verification
// ─────────────────────────────────────────
export const getPendingVerificationRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { type } = req.query;

    const whereClause = { status: "PendingVerification" };
    if (type === 'Financial') {
      whereClause.donationType = "Financial";
    }

    const result = await DonationRequestService.getPendingVerificationRequests(page, limit, whereClause);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getPendingVerificationRequests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending verification requests.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get approved financial requests for distribution
// ─────────────────────────────────────────
export const getApprovedFinancialRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await DonationRequestService.getApprovedFinancialRequests(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getApprovedFinancialRequests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved financial requests.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Verify a donation request
// ─────────────────────────────────────────
export const verifyDonationRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { approved, correctedUrgencyLevel, rejectionReason } = req.body;

    if (typeof approved !== "boolean") return res.status(400).json({ success: false, message: "Field 'approved' must be a boolean." });
    if (!approved && !rejectionReason) return res.status(400).json({ success: false, message: "Rejection reason is required." });

    await DonationRequestService.verifyDonationRequest(adminId, id, { approved, correctedUrgencyLevel, rejectionReason });

    await AuditService.createLogEntry(adminId, approved ? "Approved Donation Request" : "Rejected Donation Request", "DonationRequest", approved ? `Verified Urgency: ${correctedUrgencyLevel || "Standard"}` : rejectionReason);

    return res.status(200).json({ success: true, message: approved ? "Donation request approved." : "Donation request rejected." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to verify request." });
  }
};

// ─────────────────────────────────────────
// Recipient: Get my requests
// ─────────────────────────────────────────
export const getMyRequests = async (req, res) => {
  try {
    const requests = await DonationRequestService.getMyRequests(req.user.id);
    return res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch your requests." });
  }
};