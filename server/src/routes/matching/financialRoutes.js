import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as FinancialController from "../../controllers/matching/financialController.js";
import { upload } from "../../config/cloudinary.js";

// --- ADD THESE IMPORTS ---
import { validateRequest } from "../../middleware/donations/validateRequest.js";
import { financialContributionSchema } from "../../validations/matching/financialSchema.js";

const router = Router();

// ── Donor Routes ──
router.get("/eligibility", protect, authorize("Donor"), FinancialController.checkEligibility);

// --- ADD validateRequest(financialContributionSchema) HERE ---
router.post(
  "/contribute",
  protect,
  authorize("Donor"),
  upload.single("document"),
  validateRequest(financialContributionSchema),
  FinancialController.submitContribution
);

router.patch("/:id/cancel", protect, authorize("Donor"), FinancialController.cancelContribution);
router.get("/my-contributions", protect, authorize("Donor"), FinancialController.getMyContributions);

// ── Admin Routes ──
router.get("/", protect, authorize("Red_Cross_Admin"), FinancialController.getAllContributions);
router.get("/pending", protect, authorize("Red_Cross_Admin"), FinancialController.getPendingContributions);
router.patch("/:id/review", protect, authorize("Red_Cross_Admin"), FinancialController.reviewContribution);
router.patch("/:id/allocate", protect, authorize("Red_Cross_Admin"), FinancialController.allocateContribution);
router.patch("/:contributionId/distribute/:requestId", protect, authorize("Red_Cross_Admin"), FinancialController.distributeToRecipient);

export default router;