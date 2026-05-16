import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as AuditController from "../../controllers/security/auditController.js";

const router = Router();


router.get("/", protect, authorize("Red_Cross_Admin"), AuditController.fetchLogs);
router.get("/export", protect, authorize("Red_Cross_Admin"), AuditController.downloadAuditTrail);

export default router;