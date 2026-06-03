import { verifyAccessToken } from '../services/user.service.js';

// ============================================
// AUTH MIDDLEWARE
// ============================================

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches user payload to req.user if valid
 * Returns 401 if token is missing, invalid, or expired
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header is missing',
        details: 'Please provide token in Authorization header: Bearer <token>'
      });
    }

    // Parse Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization header format',
        details: 'Format should be: Bearer <token>'
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        error: 'Token is missing',
        details: 'Please provide a valid token'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.message.includes('expired')) {
        return res.status(401).json({
          error: 'Access token has expired',
          code: 'TOKEN_EXPIRED',
          details: 'Please use refresh token to get a new access token'
        });
      }
      throw err;
    }

    // Attach user to request
    req.user = decoded;

    // Continue to next middleware/route handler
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    
    res.status(401).json({
      error: 'Authentication failed',
      message: err.message
    });
  }
};

// ============================================
// OPTIONAL AUTH MIDDLEWARE
// ============================================

/**
 * Optional Authentication Middleware
 * Verifies JWT token if provided, but doesn't fail if missing
 * Useful for routes that work for both authenticated and unauthenticated users
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // If no authorization header, continue without user
    if (!authHeader) {
      return next();
    }

    // Parse Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(); // Continue without user
    }

    const token = parts[1];
    if (!token) {
      return next();
    }

    // Verify token
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } catch (err) {
      // Token verification failed, continue without user
      console.warn('Optional auth failed:', err.message);
    }

    next();
  } catch (err) {
    console.error('Optional auth middleware error:', err.message);
    next(); // Continue despite error
  }
};

// ============================================
// ROLE-BASED AUTH MIDDLEWARE
// ============================================

/**
 * Role-based Authorization Middleware
 * Checks if authenticated user has required role(s)
 * Must be used after authMiddleware
 * 
 * @param {string|array} requiredRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
export const roleMiddleware = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: 'User not authenticated',
          details: 'Please provide a valid authentication token'
        });
      }

      // Normalize requiredRoles to array
      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // Check if user has required role
      if (!rolesArray.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: `This action requires one of the following roles: ${rolesArray.join(', ')}`,
          userRole: req.user.role,
          requiredRoles: rolesArray
        });
      }

      next();
    } catch (err) {
      console.error('Role middleware error:', err.message);
      res.status(500).json({
        error: 'Authorization check failed',
        message: err.message
      });
    }
  };
};

// ============================================
// EXPORTS
// ============================================

export default authMiddleware;
