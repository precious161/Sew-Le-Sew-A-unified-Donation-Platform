// bloodMatchingRoutes.js
import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as BloodMatchingController from "../../controllers/matching/bloodMatchingController.js";

const router = Router();

router.post(
  "/run",
  protect,
  authorize("Red_Cross_Admin"),
  BloodMatchingController.triggerBloodMatching
);

// Donor accepts or declines a match
router.patch(
  "/:id/respond",
  protect,
  authorize("Donor"),
  BloodMatchingController.respondToMatch
);

// Admin confirms physical donation happened
router.patch(
  "/:id/complete",
  protect,
  authorize("Red_Cross_Admin"),
  BloodMatchingController.completeBloodDonation
);

export default router;