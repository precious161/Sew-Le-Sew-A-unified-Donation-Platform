import { Router } from "express";
import eligibilityRoutes from "./eligibilityRoutes.js"

const router = Router();

router.use("/donor",eligibilityRoutes);

export default router;