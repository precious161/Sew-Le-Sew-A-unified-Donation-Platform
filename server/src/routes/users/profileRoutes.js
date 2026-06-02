import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import * as ProfileController from "../../controllers/users/profileController.js";
import { upload } from "../../config/cloudinary.js";
import { updateProfileSchema, changePasswordSchema } from "../../validations/profileSchema.js";
import { validateRequest } from "../../middleware/donations/validateRequest.js";
import { validateFileUpload } from "../../middleware/fileValidation.js";

const router = Router();

// Profile CRUD with validation
router.get("/me", protect, ProfileController.viewProfile);

// ✅ Update profile - WITH VALIDATION (prevents empty/invalid fields)
router.patch(
  "/update-me",
  protect,
  validateRequest(updateProfileSchema),
  ProfileController.updateProfile
);

// ✅ Change password - WITH VALIDATION
router.post(
  "/change-password",
  protect,
  validateRequest(changePasswordSchema),
  ProfileController.changePassword
);

// ✅ Verify identity - WITH FILE VALIDATION
router.patch(
  "/verify-identity",
  protect,
  upload.single("document"),
  validateFileUpload("id_document"),
  ProfileController.uploadIdentityDocument
);

// Self role change endpoint
router.post("/change-role", protect, ProfileController.selfRoleChange);

export default router;