import { Router } from "express";
import eligibilityRoutes from "./eligibilityRoutes.js";
import intentRoutes from "./intentRoutes.js"

const router = Router();

router.use('/donor',eligibilityRoutes);
router.use('/donor',intentRoutes);

export default router;