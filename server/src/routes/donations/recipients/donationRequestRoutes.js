import { Router } from "express";
import * as DonationRequestController from "../../../controllers/donations/recipients/donationRequestController.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";
import { validateRequest } from "../../../middleware/donations/validateRequest.js";
import { donationRequestSchema } from "../../../validations/donations/recipients/donationRequestSchema.js";
import { upload } from "../../../config/cloudinary.js";
import { validateFileUpload } from "../../../middleware/fileValidation.js";

const router = Router();

// ── Recipient Routes ──
router.post(
  "/request",
  protect,
  authorize("Recipient"),
  upload.single("document"),
  validateFileUpload("medical_document"), // NEW: Enhanced validation
  validateRequest(donationRequestSchema),
  DonationRequestController.requestDonation
);

router.patch(
  "/request/:id/cancel",
  protect,
  authorize("Recipient"),
  DonationRequestController.cancelDonationRequest
);

// ── Admin Routes ──
router.get(
  "/requests/pending-verification",
  protect,
  authorize("Red_Cross_Admin"),
  DonationRequestController.getPendingVerificationRequests
);

router.get(
  "/requests/financial-approved",
  protect,
  authorize("Red_Cross_Admin"),
  DonationRequestController.getApprovedFinancialRequests
);

router.patch(
  "/requests/:id/verify",
  protect,
  authorize("Red_Cross_Admin"),
  DonationRequestController.verifyDonationRequest
);

router.get(
  "/requests/me",
  protect,
  authorize("Recipient"),
  DonationRequestController.getMyRequests
);

export default router;