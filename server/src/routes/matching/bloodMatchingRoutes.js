
import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as BloodMatchingController from "../../controllers/matching/bloodMatchingController.js";

const router = Router();

// ── Admin Routes ──
router.post(
  "/run",
  protect,
  authorize("Red_Cross_Admin"),
  BloodMatchingController.triggerBloodMatching
);

router.get(
  "/",
  protect,
  authorize("Red_Cross_Admin"),
  BloodMatchingController.getAllBloodMatches
);

router.get(
  "/unmatched",
  protect,
  authorize("Red_Cross_Admin"),
  BloodMatchingController.getUnmatchedBloodRequests
);

router.get(
  "/:id",
  protect,
  authorize("Red_Cross_Admin"),
  BloodMatchingController.getBloodMatchById
);

router.patch(
  "/:id/complete",
  protect,
  authorize("Red_Cross_Admin"),
  BloodMatchingController.completeBloodDonation
);

// ── Donor Routes ──
router.patch(
  "/:id/respond",
  protect,
  authorize("Donor"),
  BloodMatchingController.respondToMatch
);

export default router;