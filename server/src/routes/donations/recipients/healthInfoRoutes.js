import { Router } from "express";
import * as HealthInfoController from "../../../controllers/donations/recipients/healthInfoController.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/users/roleMiddleware.js";
import { validateRequest } from "../../../middleware/donations/validateRequest.js";
import { healthInfoSchema } from "../../../validations/donations/recipients/healthInfoSchema.js";

const router = Router();

router.post(
  "/health-info",
  protect,
  authorize("Recipient"),
  validateRequest(healthInfoSchema),
  HealthInfoController.submitHealthInfo
);

router.get(
  "/health-info",
  protect,
  authorize("Recipient"),
  HealthInfoController.getHealthInfo
);

router.patch(
  "/health-info",
  protect,
  authorize("Recipient"),
  validateRequest(healthInfoSchema),
  HealthInfoController.submitHealthInfo
);

export default router;