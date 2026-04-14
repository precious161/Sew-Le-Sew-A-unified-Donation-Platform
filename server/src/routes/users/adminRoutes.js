import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";
import * as AdminControl from "../../controllers/users/adminController.js";

const router = Router();

router.get("/monitor", protect, authorize("RED_CROSS_ADMIN"), AdminControl.monitorActivity);
router.patch("/status/:id", protect, authorize("RED_CROSS_ADMIN"), AdminControl.deactivateUser);
router.patch("/role/:id", protect, authorize("RED_CROSS_ADMIN"), AdminControl.assignRole);

export default router;