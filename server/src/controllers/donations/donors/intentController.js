import { registerIntent } from "../../../services/donations/donors/intentService.js";

export const handleRegisterIntent = async (req, res, next) => {
  try {
    // 1. Extract userId from auth middleware and validated body
    const userId = req.user.id;
    const intentData = req.body;

    // 2. Call the service layer
    const newIntent = await registerIntent(userId, intentData);

    // 3. Success Response
    return res.status(201).json({
      success: true,
      message: "Intention registered successfully. You are now in the active donor pool.",
      data: newIntent
    });

  } catch (error) {
    // 4. Error Handling
    // If our service threw an error with a statusCode (403, 409), we use it
    // otherwise, we default to 500 (Internal Server Error)
    const status = error.statusCode || 500;

    return res.status(status).json({
      success: false,
      message: error.message || "An unexpected error occurred while registering your intent."
    });
  }
};