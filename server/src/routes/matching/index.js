
import { Router } from "express";
import bloodMatchingRoutes from "./bloodMatchingRoutes.js";
import inKindMatchingRoutes from "./inKindMatchingRoutes.js";
import financialRoutes from "./financialRoutes.js";

const router = Router();

router.use("/blood", bloodMatchingRoutes);
router.use("/inkind", inKindMatchingRoutes);
router.use("/financial", financialRoutes);

export default router;