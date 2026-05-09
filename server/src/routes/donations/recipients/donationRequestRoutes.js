
import { Router } from "express";
import * as DonationRequestController from "../../../controllers/donations/recipients/donationRequestController.js";
import * as HealthInfoController from "../../../controllers/donations/recipients/healthInfoController.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";
import { validateRequest } from "../../../middleware/donations/validateRequest.js";
import { donationRequestSchema } from "../../../validations/donations/recipients/donationRequestSchema.js";
import { healthInfoSchema } from "../../../validations/donations/recipients/healthInfoSchema.js";
import { upload } from "../../../config/cloudinary.js";

const router = Router();

// ── Recipient Routes ──
router.post(
  "/request",
  protect,
  authorize("Recipient"),
  upload.single("document"),
  validateRequest(donationRequestSchema),
  DonationRequestController.requestDonation
);

router.patch(
  "/request/:id/cancel",
  protect,
  authorize("Recipient"),
  DonationRequestController.cancelDonationRequest
);

router.post(
  "/health-info",
  protect,
  authorize("Recipient"),
  validateRequest(healthInfoSchema),
  HealthInfoController.submitHealthInfo
);

// ── Admin Routes ──
router.get(
  "/requests/pending-verification",
  protect,
  authorize("Red_Cross_Admin"),
  DonationRequestController.getPendingVerificationRequests
);

router.patch(
  "/requests/:id/verify",
  protect,
  authorize("Red_Cross_Admin"),
  DonationRequestController.verifyDonationRequest
);

export default router;