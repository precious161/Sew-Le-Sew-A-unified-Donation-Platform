import { Router } from "express";
import profileRoutes from "./profileRoutes.js";
import adminRoutes from "./adminRoutes.js";
import alertRoutes from "./alertRoutes.js";

const router = Router();

router.use("/profile", profileRoutes);
router.use("/admin", adminRoutes);
router.use("/alerts", alertRoutes);

export default router;