import { Router } from "express";
import * as eligibilityController from "../../controllers/donations/eligibilityController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { validate } from "../../middleware/validateEligibility.js";
import { eligibilitySchema } from "../../validations/eligibilitySchema.js";

const router = Router();

router.post("/check",protect,validate(eligibilitySchema),eligibilityController.checkEligibility);
router.get("/eligibilityHistory",protect,eligibilityController.getMyHistory);

export default router;