// alertRoutes.js
import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as AlertService from "../../controllers/users/alertController.js";

const router = Router();

router.get("/", protect, AlertService.getMyNotifications);
router.patch("/:id/read", protect, AlertService.markAsRead);
router.patch("/read-all", protect, AlertService.markAllAsRead);
router.post("/send", protect, authorize("Red_Cross_Admin"), AlertService.sendAlert);

export default router;