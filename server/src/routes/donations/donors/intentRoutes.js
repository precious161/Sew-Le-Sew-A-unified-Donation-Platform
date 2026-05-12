import { Router } from "express";
import {
  handleRegisterIntent,
  handleCancelIntent,
  handleGetMyIntents,
  handleVerifyIntent,
  handleGetPendingIntents
} from "../../../controllers/donations/donors/intentController.js";
import { registerIntentSchema } from "../../../validations/donations/donors/intentSchema.js";
import { validateRequest } from "../../../middleware/donations/validateRequest.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";
import { upload } from "../../../config/cloudinary.js";

const router = Router();

// ── Donor Routes ──
router.post(
  "/register-intent",
  protect,
  authorize("Donor"),
  upload.single("document"),
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

// ── Admin Routes ──

router.get(
  "/pending",
  protect,
  authorize("Red_Cross_Admin"),
  handleGetPendingIntents
);


router.patch(
  "/:id/verify",
  protect,
  authorize("Red_Cross_Admin"),
  handleVerifyIntent
);


export default router;