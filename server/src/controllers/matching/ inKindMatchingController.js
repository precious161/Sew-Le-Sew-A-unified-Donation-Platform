import * as InKindMatchingService from "../../services/matching/inKindMatchingService.js";
import * as AuditService from "../../services/security/auditService.js";

// ─────────────────────────────────────────
// Admin: Manually trigger matching engine
// ─────────────────────────────────────────
export const triggerInKindMatching = async (req, res) => {
  try {
    await InKindMatchingService.runInKindMatching();

    return res.status(200).json({
      success: true,
      message: "In-Kind matching engine ran successfully.",
    });
  } catch (error) {
    console.error("triggerInKindMatching Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to run In-Kind matching engine.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get all In-Kind matches
// ─────────────────────────────────────────
export const getAllInKindMatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await InKindMatchingService.getAllInKindMatches(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getAllInKindMatches Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch In-Kind matches.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get single In-Kind match by ID
// ─────────────────────────────────────────
export const getInKindMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await InKindMatchingService.getInKindMatchById(id);

    return res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error("getInKindMatchById Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch match.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get unmatched pending In-Kind requests
// ─────────────────────────────────────────
export const getUnmatchedInKindRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await InKindMatchingService.getUnmatchedInKindRequests(
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getUnmatchedInKindRequests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unmatched In-Kind requests.",
    });
  }
};

// ─────────────────────────────────────────
// Donor: Accept or decline a match
// ─────────────────────────────────────────
export const respondToInKindMatch = async (req, res) => {
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

    await InKindMatchingService.handleInKindDonorResponse(
      matchId,
      donorId,
      accepted
    );

    return res.status(200).json({
      success: true,
      message: accepted
        ? "You have accepted the match. Please proceed to the Red Cross Center with the items."
        : "You have declined the match. We will notify you of future matches.",
    });
  } catch (error) {
    console.error("respondToInKindMatch Error:", error);
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
export const completeInKindDonation = async (req, res) => {
  try {
    const matchId = req.params.id;
    const adminId = req.user.id;

    await InKindMatchingService.confirmInKindCompletion(matchId, adminId);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, "Completed In-Kind Donation", "Match", `Match ID: ${matchId}`);

    return res.status(200).json({ success: true, message: "In-Kind donation marked as completed successfully." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};