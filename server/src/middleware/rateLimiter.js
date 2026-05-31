import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for login`, { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});

// Signup rate limiter - 3 accounts per hour per IP
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many accounts created. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for signup`, { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});

// Password reset request limiter
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for password reset`, { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});

// ============================================
// Donation Management Rate Limiters
// ============================================

// Donation intent registration - 5 per hour
export const intentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many donation intents registered. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for donation intent`, { userId: req.user?.id, ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});

// Donation request submission - 3 per hour
export const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many donation requests submitted. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for donation request`, { userId: req.user?.id, ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});

// Eligibility check - 10 per hour
export const eligibilityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many eligibility checks. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for eligibility check`, { userId: req.user?.id, ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});

// Financial contribution submission - 3 per day
export const contributionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many financial contributions submitted. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for financial contribution`, { userId: req.user?.id, ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});

// ============================================
//  Matching Engine Rate Limiter
// ============================================

// Matching engine execution - 10 per hour (admin only)
export const matchingEngineLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many matching engine executions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST', // Only limit POST requests (trigger matching)
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for matching engine`, { adminId: req.user?.id, ip: req.ip });
    res.status(options.statusCode).json(options.message);
  }
});