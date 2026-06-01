import { Router } from "express";
import eligibilityRoutes from "./donors/eligibilityRoutes.js";
import intentRoutes from "./donors/intentRoutes.js";
import donationRequestRoutes from "./recipients/donationRequestRoutes.js";
import healthInfoRoutes from "./recipients/healthInfoRoutes.js";
import historyRoutes from "./donors/historyRoutes.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/users/roleMiddleware.js";
import { intentLimiter, requestLimiter, eligibilityLimiter, contributionLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

// Apply rate limiters to donation routes
router.use("/donor/check", protect, eligibilityLimiter);
router.use("/donor/register-intent", protect, intentLimiter);
router.use("/recipient/request", protect, requestLimiter);
router.use("/donor/financial", protect, contributionLimiter);

router.use("/donor", eligibilityRoutes);
router.use("/donor", intentRoutes);
router.use("/donor/history", historyRoutes);
router.use("/recipient", donationRequestRoutes);
router.use("/recipient", healthInfoRoutes);

export default router;