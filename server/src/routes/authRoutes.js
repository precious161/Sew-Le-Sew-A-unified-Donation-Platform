import { Router } from "express";
import { signUp,login } from "../controllers/authController.js";
import { validate } from "../middleware/validateSchema.js";
import { signUpSchema,loginSchema } from "../validations/authSchema.js";

const router=Router();

router.post('/signup',validate(signUpSchema),signUp);
router.post('/login',validate(loginSchema),login);

export default router;