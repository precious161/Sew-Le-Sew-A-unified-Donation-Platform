
import { Router } from "express";
import {
  handleRegisterIntent,
  handleCancelIntent,
  handleGetMyIntents,
} from "../../../controllers/donations/donors/intentController.js";
import { registerIntentSchema } from "../../../validations/donations/donors/intentSchema.js";
import { validateRequest } from "../../../middleware/donations/validateRequest.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";

const router = Router();

router.post(
  "/register-intent",
  protect,
  authorize("Donor"),
  validateRequest(registerIntentSchema),
  handleRegisterIntent
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("Donor"),
  handleCancelIntent
);

router.get(
  "/my-intents",
  protect,
  authorize("Donor"),
  handleGetMyIntents
);

export default router;