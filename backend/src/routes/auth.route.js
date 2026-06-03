import express from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser
} from '../controller/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// VALIDATION RULES
// ============================================

const signupValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character (!@#$%^&*)'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('role')
    .optional()
    .isIn(['organizer', 'attendee'])
    .withMessage('Role must be either "organizer" or "attendee"')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string')
];

// ============================================
// ROUTES
// ============================================

/**
 * POST /auth/signup
 * Register a new user
 * Body: { email, password, name, role? }
 */
router.post('/signup', signupValidation, signup);

/**
 * POST /auth/login
 * Login user with email and password
 * Body: { email, password }
 */
router.post('/login', loginValidation, login);

/**
 * POST /auth/logout
 * Logout user and clear session
 */
router.post('/logout', logout);

/**
 * POST /auth/refresh-token
 * Generate new access token using refresh token
 * Body: { refreshToken? } (or from cookie)
 */
router.post('/refresh-token', refreshTokenValidation, refreshAccessToken);

/**
 * GET /auth/me
 * Get current authenticated user info (requires JWT authentication)
 */
router.get('/me', authMiddleware, getCurrentUser);

// ============================================
// EXPORT
// ============================================

export default router;
