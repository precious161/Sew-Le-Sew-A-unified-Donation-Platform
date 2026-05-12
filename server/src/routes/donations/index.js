import { Router } from "express";
import eligibilityRoutes from "./donors/eligibilityRoutes.js";
import intentRoutes from "./donors/intentRoutes.js";
import donationRequestRoutes from "./recipients/donationRequestRoutes.js";
import healthInfoRoutes from "./recipients/healthInfoRoutes.js"

const router = Router();

router.use("/donor",eligibilityRoutes);
router.use("/donor",intentRoutes);
router.use("/recipient",donationRequestRoutes);
router.use("/recipient",healthInfoRoutes);

export default router;