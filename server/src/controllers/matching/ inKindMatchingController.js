
import * as InKindMatchingService from "../../services/matching/inKindMatchingService.js";

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

    await InKindMatchingService.handleInKindDonorResponse(matchId, donorId, accepted);

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

export const completeInKindDonation = async (req, res) => {
  try {
    const matchId = req.params.id;
    const adminId = req.user.id;

    await InKindMatchingService.confirmInKindCompletion(matchId, adminId);

    return res.status(200).json({
      success: true,
      message: "In-Kind donation marked as completed successfully.",
    });
  } catch (error) {
    console.error("completeInKindDonation Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to complete In-Kind donation.",
    });
  }
};