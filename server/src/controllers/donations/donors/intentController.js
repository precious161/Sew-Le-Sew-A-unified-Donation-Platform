
import {
  registerIntent,
  cancelIntent,
  getMyIntents,
} from "../../../services/donations/donors/intentService.js";

// ─────────────────────────────────────────
// Register a new donation intent
// ─────────────────────────────────────────
export const handleRegisterIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const intentData = req.body;

    const newIntent = await registerIntent(userId, intentData);

    return res.status(201).json({
      success: true,
      message: "Intent registered successfully. You are now in the active donor pool.",
      data: newIntent,
    });
  } catch (error) {
    console.error("handleRegisterIntent Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "An unexpected error occurred while registering your intent.",
    });
  }
};

// ─────────────────────────────────────────
// Cancel an active intent
// ─────────────────────────────────────────
export const handleCancelIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cancelled = await cancelIntent(userId, id);

    return res.status(200).json({
      success: true,
      message: "Intent cancelled successfully.",
      data: cancelled,
    });
  } catch (error) {
    console.error("handleCancelIntent Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to cancel intent.",
    });
  }
};

// ─────────────────────────────────────────
// Get donor's own intents
// ─────────────────────────────────────────
export const handleGetMyIntents = async (req, res) => {
  try {
    const userId = req.user.id;

    const intents = await getMyIntents(userId);

    return res.status(200).json({
      success: true,
      count: intents.length,
      data: intents,
    });
  } catch (error) {
    console.error("handleGetMyIntents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch intents.",
    });
  }
};