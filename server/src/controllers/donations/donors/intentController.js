import { registerIntent, cancelIntent, getMyIntents, verifyDonorIntent, getPendingIntents } from "../../../services/donations/donors/intentService.js";
import * as AuditService from "../../../services/security/auditService.js";

export const handleRegisterIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    // --- CHANGED: Extract documentUrl from multer/cloudinary ---
    const intentData = {
      ...req.body,
      documentUrl: req.file?.path || null,
    };

    const newIntent = await registerIntent(userId, intentData);

    return res.status(201).json({
      success: true,
      message: newIntent.category === "Organ"
        ? "Organ intent registered and pending medical verification."
        : "Intent registered successfully. You are now in the active donor pool.",
      data: newIntent,
    });
  } catch (error) {
    console.error("handleRegisterIntent Error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Error registering intent." });
  }
};


export const handleVerifyIntent = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    if (typeof approved !== "boolean") return res.status(400).json({ success: false, message: "Field 'approved' must be a boolean." });
    if (!approved && !rejectionReason) return res.status(400).json({ success: false, message: "Rejection reason is required when rejecting." });

    await verifyDonorIntent(adminId, id, { approved, rejectionReason });

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, approved ? "Approved Donor Intent" : "Rejected Donor Intent", "DonationIntent", approved ? "Medically Cleared" : rejectionReason);

    return res.status(200).json({ success: true, message: approved ? "Intent verified successfully. Engine triggered." : "Intent rejected successfully." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to verify intent." });
  }
};

export const handleCancelIntent = async (req, res) => {
  try {
    const cancelled = await cancelIntent(req.user.id, req.params.id);
    return res.status(200).json({ success: true, message: "Intent cancelled successfully.", data: cancelled });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to cancel intent." });
  }
};

export const handleGetMyIntents = async (req, res) => {
  try {
    const intents = await getMyIntents(req.user.id);
    return res.status(200).json({ success: true, count: intents.length, data: intents });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch intents." });
  }
};

export const handleGetPendingIntents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getPendingIntents(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("handleGetPendingIntents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending intents.",
    });
  }
};