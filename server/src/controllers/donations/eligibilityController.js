import * as EligibilityService from "../../services/donations/eligibilityService.js";

export const checkEligibility = async (req, res) => {
  try {
    // 1. Extract data
    const userId = req.user.id;
    const { category, answers } = req.body;

    // 2. Validation: Ensure we have what we need before hitting the service
    if (!category || !answers) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: category and answers are mandatory."
      });
    }

    // 3. Call the Service (Our Engine)
    const result = await EligibilityService.processEligibility(
      userId,
      category,
      answers
    );

    // 4. Respond
    return res.status(200).json({
      success: true,
      message: result.isEligible
        ? "Congratulations! You are eligible for this donation category."
        : "You are currently ineligible for this category.",
      data: result
    });

  } catch (error) {
    console.error("Eligibility Controller Error:", error);

    // Specific error handling for missing standards
    if (error.message.includes("No medical standards found")) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while processing eligibility."
    });
  }
};

export const getMyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await EligibilityService.getEligibilityHistory(userId);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Get History Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve eligibility history.",
    });
  }
};