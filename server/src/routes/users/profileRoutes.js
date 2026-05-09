import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import * as ProfileService from "../../controllers/users/profileController.js";
import { upload } from "../../config/cloudinary.js"; // <-- ADD THIS IMPORT

const router = Router();

router.get("/me", protect, ProfileService.viewProfile);
router.patch("/update-me", protect, ProfileService.updateProfile);
router.patch(
  "/verify-identity",
  protect,
  upload.single("document"), // Cloudinary middleware interceptor
  ProfileService.uploadIdentityDocument
);

export default router;