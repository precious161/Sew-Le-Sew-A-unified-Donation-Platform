import { Router } from "express";
import { signUp,login,logout } from "../controllers/authController.js";
import { validate } from "../middleware/users/validateSchema.js";
import { signUpSchema,loginSchema } from "../validations/authSchema.js";
import { protect } from "../middleware/authMiddleware.js";

const router=Router();

router.post('/signup',validate(signUpSchema),signUp);
router.post('/login',validate(loginSchema),login);
router.post('/logout', protect, logout);

export default router;