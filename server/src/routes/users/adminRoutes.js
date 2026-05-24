import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import * as AdminControl from "../../controllers/users/adminController.js";

const router = Router();

// User monitoring and management
router.get("/monitor", protect, authorize("Red_Cross_Admin"), AdminControl.monitorActivity);
router.patch("/status/:id", protect, authorize("Red_Cross_Admin"), AdminControl.deactivateUser);

// Role management - OLD endpoint (deprecated, kept for backward compatibility)
router.patch("/role/:id", protect, authorize("Red_Cross_Admin"), AdminControl.assignRole);

// NEW: Safe role change with cleanup (RECOMMENDED)
router.put("/safe-role-change/:userId", protect, authorize("Red_Cross_Admin"), AdminControl.safeRoleChange);

// Identity verification
router.get("/identities/pending", protect, authorize("Red_Cross_Admin"), AdminControl.getPendingIdentities);
router.patch("/identities/:id/review", protect, authorize("Red_Cross_Admin"), AdminControl.reviewIdentity);

export default router;