import { Router } from "express";
import * as DonationRequestController from "../../../controllers/donations/recipients/donationRequestController.js";
import * as HealthInfoController from "../../../controllers/donations/recipients/healthInfoController.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { validateRequest }  from "../../../middleware/donations/validateRequest.js";
import { donationRequestSchema } from "../../../validations/donations/recipients/donationRequestSchema.js";
import { healthInfoSchema } from "../../../validations/donations/recipients/healthInfoSchema.js";

const router= Router();

router.post("/request",protect,validateRequest(donationRequestSchema), DonationRequestController.requestDonation);
router.post("/health-info",protect,validateRequest(healthInfoSchema),HealthInfoController.submitHealthInfo);

export default router;