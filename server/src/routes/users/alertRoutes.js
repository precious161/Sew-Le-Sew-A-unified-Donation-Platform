import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";
import * as AlertService from "../../controllers/users/alertController.js";

const router = Router();

router.get("/", protect, AlertService.getMyNotifications);
router.patch("/:id/read", protect, AlertService.markAsRead);
router.post("/send", protect, authorize("RED_CROSS_ADMIN"), AlertService.sendAlert);

export default router;