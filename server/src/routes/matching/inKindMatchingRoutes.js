
import { Router } from "express";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";
import * as InKindMatchingController from "../../../controllers/matching/inKindMatchingController.js";

const router = Router();

// Admin manually triggers matching engine if needed
router.post(
  "/run",
  protect,
  authorize("Red_Cross_Admin"),
  InKindMatchingController.triggerInKindMatching
);

// Donor accepts or declines a match
router.patch(
  "/:id/respond",
  protect,
  authorize("Donor"),
  InKindMatchingController.respondToInKindMatch
);

// Admin confirms physical donation happened
router.patch(
  "/:id/complete",
  protect,
  authorize("Red_Cross_Admin"),
  InKindMatchingController.completeInKindDonation
);

export default router;