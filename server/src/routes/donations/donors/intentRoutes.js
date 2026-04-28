import { Router } from "express";
import { handleRegisterIntent } from "../../../controllers/donations/donors/intentController.js";
import { registerIntentSchema } from "../../../validations/donations/donors/intentSchema.js";
import { validateRequest } from "../../../middleware/donations/validateRequest.js";
import { protect } from "../../../middleware/authMiddleware.js";

const router = Router();

router.post(
  '/register-intent',
  protect,
  validateRequest(registerIntentSchema),
  handleRegisterIntent
);

export default router;