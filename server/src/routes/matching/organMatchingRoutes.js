import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as OrganMatchingController from "../../controllers/matching/organMatchingController.js";

const router = Router();

// ── Admin Routes ──
router.post("/run", protect, authorize("Red_Cross_Admin"), OrganMatchingController.triggerOrganMatching);
router.get("/", protect, authorize("Red_Cross_Admin"), OrganMatchingController.getAllOrganMatches);
router.get("/unmatched", protect, authorize("Red_Cross_Admin"), OrganMatchingController.getUnmatchedOrganRequests);
router.get("/:id", protect, authorize("Red_Cross_Admin"), OrganMatchingController.getOrganMatchById);
router.patch("/:id/complete", protect, authorize("Red_Cross_Admin"), OrganMatchingController.completeOrganDonation);

// ── Donor Routes ──
router.patch("/:id/respond", protect, authorize("Donor"), OrganMatchingController.respondToOrganMatch);

export default router;