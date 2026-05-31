import { Router } from "express";
import { signUp, login, logout, forgotPassword, resetPassword } from "../controllers/authController.js";
import { validate } from "../middleware/users/validateSchema.js";
import { signUpSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/authSchema.js";
import { protect } from "../middleware/authMiddleware.js";
import { loginLimiter, signupLimiter, resetPasswordLimiter } from "../middleware/rateLimiter.js";
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const router = Router();

router.post('/signup', signupLimiter, validate(signUpSchema), signUp);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', protect, logout);
router.post('/forgot-password', resetPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Create JWT token
    const token = jwt.sign(
      { userId: req.user.id },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}/oauth-redirect?token=${token}`);
  }
);

export default router;