import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as InKindMatchingController from "../../controllers/matching/ inKindMatchingController.js";

const router = Router();

// ── Admin Routes ──
router.post(
  "/run",
  protect,
  authorize("Red_Cross_Admin"),
  InKindMatchingController.triggerInKindMatching
);

router.get(
  "/",
  protect,
  authorize("Red_Cross_Admin"),
  InKindMatchingController.getAllInKindMatches
);

router.get(
  "/unmatched",
  protect,
  authorize("Red_Cross_Admin"),
  InKindMatchingController.getUnmatchedInKindRequests
);

router.get(
  "/:id",
  protect,
  authorize("Red_Cross_Admin"),
  InKindMatchingController.getInKindMatchById
);

router.patch(
  "/:id/complete",
  protect,
  authorize("Red_Cross_Admin"),
  InKindMatchingController.completeInKindDonation
);

// ── Donor Routes ──
router.patch(
  "/:id/respond",
  protect,
  authorize("Donor"),
  InKindMatchingController.respondToInKindMatch
);

export default router;