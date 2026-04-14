import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import * as ProfileService from "../../controllers/users/profileController.js";


const router = Router();

router.get("/me", protect, ProfileService.viewProfile);
router.patch("/update-me", protect, ProfileService.updateProfile);

export default router;