import { Router } from "express";
import * as HealthInfoController from "../../../controllers/donations/recipients/healthInfoController.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";
import { validateRequest } from "../../../middleware/donations/validateRequest.js";
import { healthInfoSchema } from "../../../validations/donations/recipients/healthInfoSchema.js";

const router = Router();

// ALLOW BOTH DONOR AND RECIPIENT
router.post(
  "/",
  protect,
  authorize("Recipient", "Donor"),
  validateRequest(healthInfoSchema),
  HealthInfoController.submitHealthInfo
);

router.get(
  "/",
  protect,
  authorize("Recipient", "Donor"),
  HealthInfoController.getHealthInfo
);

router.patch(
  "/",
  protect,
  authorize("Recipient", "Donor"),
  validateRequest(healthInfoSchema),
  HealthInfoController.submitHealthInfo
);

export default router;