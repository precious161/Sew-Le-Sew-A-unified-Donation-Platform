import { Router } from "express";
import { handleRegisterIntent } from "../../controllers/donations/intentController.js";
import { registerIntentSchema } from "../../validations/donations/intentSchema.js";
import { validateIntent } from "../../middleware/donations/validateIntent.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = Router();

router.post(
  '/register-intent',
  protect,
  validateIntent(registerIntentSchema),
  handleRegisterIntent
);

export default router;