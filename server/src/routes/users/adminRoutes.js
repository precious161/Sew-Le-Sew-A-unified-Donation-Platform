import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as AdminControl from "../../controllers/users/adminController.js";

const router = Router();

router.get("/monitor", protect, authorize("Red_Cross_Admin"), AdminControl.monitorActivity);
router.patch("/status/:id", protect, authorize("Red_Cross_Admin"), AdminControl.deactivateUser);
router.patch("/role/:id", protect, authorize("Red_Cross_Admin"), AdminControl.assignRole);
router.get("/identities/pending", protect, authorize("Red_Cross_Admin"), AdminControl.getPendingIdentities);
router.patch("/identities/:id/review", protect, authorize("Red_Cross_Admin"), AdminControl.reviewIdentity);

export default router;