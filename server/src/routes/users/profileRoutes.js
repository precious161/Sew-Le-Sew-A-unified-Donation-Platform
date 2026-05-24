import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import * as ProfileService from "../../controllers/users/profileController.js";
import { upload } from "../../config/cloudinary.js";

const router = Router();

// Profile CRUD
router.get("/me", protect, ProfileService.viewProfile);
router.patch("/update-me", protect, ProfileService.updateProfile);
router.patch(
  "/verify-identity",
  protect,
  upload.single("document"),
  ProfileService.uploadIdentityDocument
);

// Self role change endpoint (any logged-in user can use this)
router.post("/change-role", protect, ProfileService.selfRoleChange);

export default router;