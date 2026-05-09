
import * as DonationRequestService from "../../../services/donations/recipients/donationRequestService.js";

// ─────────────────────────────────────────
// Recipient: Submit a donation request
// ─────────────────────────────────────────
export const requestDonation = async (req, res) => {
  try {
    const userId = req.user.id;

    // Merge body data with documentUrl from Cloudinary
    // req.file is set by multer after successful upload
    const data = {
      ...req.body,
      documentUrl: req.file?.path || null,
    };

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

    const result = await DonationRequestService.getPendingVerificationRequests(
      page,
      limit
    );

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
// Admin: Verify a donation request
// ─────────────────────────────────────────
export const verifyDonationRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { approved, correctedUrgencyLevel, rejectionReason } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Field 'approved' must be a boolean (true or false).",
      });
    }

    if (!approved && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting a request.",
      });
    }

    const validUrgencyLevels = ["Low", "Medium", "High", "Critical"];
    if (
      correctedUrgencyLevel &&
      !validUrgencyLevels.includes(correctedUrgencyLevel)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid urgency level. Must be Low, Medium, High, or Critical.",
      });
    }

    await DonationRequestService.verifyDonationRequest(adminId, id, {
      approved,
      correctedUrgencyLevel,
      rejectionReason,
    });

    return res.status(200).json({
      success: true,
      message: approved
        ? "Donation request approved successfully. Matching engine has been triggered."
        : "Donation request rejected successfully. Recipient has been notified.",
    });
  } catch (error) {
    console.error("verifyDonationRequest Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to verify donation request.",
    });
  }
};