import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import { contributionLimiter } from "../../middleware/rateLimiter.js";
import { upload } from "../../config/cloudinary.js";
import { validateRequest } from "../../middleware/donations/validateRequest.js";
import { financialContributionSchema } from "../../validations/matching/financialSchema.js";
import * as financialController from "../../controllers/matching/financialController.js";

const router = Router();

// ── Donor Routes ──
router.get(
  "/eligibility",
  protect,
  authorize("Donor"),
  financialController.checkEligibility
);

router.post(
  "/contribute",
  protect,
  authorize("Donor"),
  contributionLimiter,
  upload.single("document"),
  validateRequest(financialContributionSchema),
  financialController.submitContribution
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("Donor"),
  financialController.cancelContribution
);

router.get(
  "/my-contributions",
  protect,
  authorize("Donor"),
  financialController.getMyContributions
);

// ── Admin Routes ──
router.get(
  "/",
  protect,
  authorize("Red_Cross_Admin"),
  financialController.getAllContributions
);

router.get(
  "/pending",
  protect,
  authorize("Red_Cross_Admin"),
  financialController.getPendingContributions
);

router.get(
  "/verified",
  protect,
  authorize("Red_Cross_Admin"),
  financialController.getVerifiedContributions
);

router.patch(
  "/:id/review",
  protect,
  authorize("Red_Cross_Admin"),
  financialController.reviewContribution
);

router.patch(
  "/:id/allocate",
  protect,
  authorize("Red_Cross_Admin"),
  financialController.allocateContribution
);

router.patch(
  "/:contributionId/distribute/:requestId",
  protect,
  authorize("Red_Cross_Admin"),
  financialController.distributeToRecipient
);

export default router;