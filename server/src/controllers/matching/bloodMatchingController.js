import * as BloodMatchingService from "../../services/matching/bloodMatchingService.js";
import * as AuditService from "../../services/security/auditService.js";

// ─────────────────────────────────────────
// Admin: Manually trigger matching engine
// ─────────────────────────────────────────
export const triggerBloodMatching = async (req, res) => {
  try {
    await BloodMatchingService.runBloodMatching();

    return res.status(200).json({
      success: true,
      message: "Blood matching engine ran successfully.",
    });
  } catch (error) {
    console.error("triggerBloodMatching Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to run blood matching engine.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get all blood matches
// ─────────────────────────────────────────
export const getAllBloodMatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await BloodMatchingService.getAllBloodMatches(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getAllBloodMatches Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blood matches.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get single match by ID
// ─────────────────────────────────────────
export const getBloodMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await BloodMatchingService.getBloodMatchById(id);

    return res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error("getBloodMatchById Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch match.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get unmatched pending blood requests
// ─────────────────────────────────────────
export const getUnmatchedBloodRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await BloodMatchingService.getUnmatchedBloodRequests(
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getUnmatchedBloodRequests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unmatched blood requests.",
    });
  }
};

// ─────────────────────────────────────────
// Donor: Accept or decline a match
// ─────────────────────────────────────────
export const respondToMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const donorId = req.user.id;
    const { accepted } = req.body;

    if (typeof accepted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Field 'accepted' must be a boolean (true or false).",
      });
    }

    await BloodMatchingService.handleDonorResponse(matchId, donorId, accepted);

    return res.status(200).json({
      success: true,
      message: accepted
        ? "You have accepted the match. Please proceed to the Red Cross Center."
        : "You have declined the match. We will notify you of future matches.",
    });
  } catch (error) {
    console.error("respondToMatch Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to process your response.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Confirm physical donation happened
// ─────────────────────────────────────────
export const completeBloodDonation = async (req, res) => {
  try {
    const matchId = req.params.id;
    const adminId = req.user.id;

    await BloodMatchingService.confirmDonationCompletion(matchId, adminId);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, "Completed Blood Donation", "Match", `Match ID: ${matchId}`);

    return res.status(200).json({ success: true, message: "Donation marked as completed successfully." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};