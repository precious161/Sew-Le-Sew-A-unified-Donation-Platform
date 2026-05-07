
import * as BloodMatchingService from "../../services/matching/bloodMatchingService.js";

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

export const completeBloodDonation = async (req, res) => {
  try {
    const matchId = req.params.id;
    const adminId = req.user.id;

    await BloodMatchingService.confirmDonationCompletion(matchId, adminId);

    return res.status(200).json({
      success: true,
      message: "Donation marked as completed successfully.",
    });
  } catch (error) {
    console.error("completeBloodDonation Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to complete donation.",
    });
  }
};