import { validationResult } from 'express-validator';
import {
  createUser,
  validateCredentials,
  generateTokens,
  getUserById,
  verifyRefreshToken,
  generateAccessToken
} from '../services/user.service.js';

// ============================================
// SIGNUP CONTROLLER
// ============================================

/**
 * POST /auth/signup
 * Register a new user and return access & refresh tokens
 */
export const signup = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, role } = req.body;

    // Create user
    const user = await createUser({
      email,
      password,
      name,
      role: role || 'attendee'
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Return success response
    res.status(201).json({
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens
      }
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    
    // Handle specific errors
    if (err.message.includes('already exists')) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: err.message
    });
  }
};

// ============================================
// LOGIN CONTROLLER
// ============================================

/**
 * POST /auth/login
 * Authenticate user with email & password and return tokens
 */
export const login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Validate credentials
    const user = await validateCredentials(email, password);

    // Generate tokens
    const tokens = generateTokens(user);

    // Set refresh token as httpOnly cookie (optional, for extra security)
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response
    res.status(200).json({
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    
    // Handle authentication errors
    if (err.message.includes('Invalid email or password')) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    res.status(500).json({
      error: 'Login failed',
      message: err.message
    });
  }
};

// ============================================
// LOGOUT CONTROLLER
// ============================================

/**
 * POST /auth/logout
 * Logout user by clearing refresh token cookie
 */
export const logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      message: 'Logout successful'
    });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({
      error: 'Logout failed',
      message: err.message
    });
  }
};

// ============================================
// REFRESH TOKEN CONTROLLER
// ============================================

/**
 * POST /auth/refresh-token
 * Generate new access token using refresh token
 */
export const refreshAccessToken = async (req, res) => {
  try {
    // Get refresh token from request body, cookie, or headers
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user info
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      message: 'Access token refreshed',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (err) {
    console.error('Refresh token error:', err.message);

    if (err.message.includes('expired') || err.message.includes('Invalid')) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token'
      });
    }

    res.status(500).json({
      error: 'Token refresh failed',
      message: err.message
    });
  }
};

// ============================================
// GET CURRENT USER CONTROLLER
// ============================================

/**
 * GET /auth/me
 * Get current authenticated user info (requires JWT middleware)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User should be attached to req by auth middleware
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Get full user info from database
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.status(200).json({
      message: 'User info retrieved',
      data: {
        user
      }
    });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({
      error: 'Failed to retrieve user info',
      message: err.message
    });
  }
};

// ============================================
// EXPORT
// ============================================

export default {
  signup,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser
};
