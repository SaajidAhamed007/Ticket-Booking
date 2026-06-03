import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { selectOne, insert } from '../utils/db.js';

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash a password using bcryptjs
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (err) {
    throw new Error(`Failed to hash password: ${err.message}`);
  }
};

/**
 * Compare plain text password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePasswords = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (err) {
    throw new Error(`Failed to compare passwords: ${err.message}`);
  }
};

// ============================================
// JWT TOKEN GENERATION
// ============================================

/**
 * Generate JWT access token
 * @param {object} user - User object with id and role
 * @returns {string} Signed JWT access token
 */
export const generateAccessToken = (user) => {
  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
    const expiresIn = process.env.JWT_EXPIRY || '1h';
    
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    return jwt.sign(payload, secret, { expiresIn });
  } catch (err) {
    throw new Error(`Failed to generate access token: ${err.message}`);
  }
};

/**
 * Generate JWT refresh token
 * @param {object} user - User object with id
 * @returns {string} Signed JWT refresh token
 */
export const generateRefreshToken = (user) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_here';
    const expiresIn = process.env.JWT_REFRESH_EXPIRY || '7d';

    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, secret, { expiresIn });
  } catch (err) {
    throw new Error(`Failed to generate refresh token: ${err.message}`);
  }
};

/**
 * Generate both access and refresh tokens
 * @param {object} user - User object
 * @returns {object} Object with accessToken and refreshToken
 */
export const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};

// ============================================
// TOKEN VERIFICATION
// ============================================

/**
 * Verify JWT access token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    throw new Error(`Invalid access token: ${err.message}`);
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_here';
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    throw new Error(`Invalid refresh token: ${err.message}`);
  }
};

// ============================================
// USER LOOKUP
// ============================================

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<object|null>} User object or null
 */
export const getUserById = async (userId) => {
  try {
    const query = 'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1';
    return await selectOne(query, [userId]);
  } catch (err) {
    throw new Error(`Failed to get user by ID: ${err.message}`);
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User object or null
 */
export const getUserByEmail = async (email) => {
  try {
    const query = 'SELECT id, email, name, role, password_hash, created_at, updated_at FROM users WHERE email = $1';
    return await selectOne(query, [email]);
  } catch (err) {
    throw new Error(`Failed to get user by email: ${err.message}`);
  }
};

// ============================================
// USER AUTHENTICATION
// ============================================

/**
 * Validate user credentials (email and password)
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<object>} User object if credentials are valid
 * @throws {Error} If email not found or password is incorrect
 */
export const validateCredentials = async (email, password) => {
  try {
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await comparePasswords(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (err) {
    throw err;
  }
};

// ============================================
// USER CREATION
// ============================================

/**
 * Create a new user
 * @param {object} userData - User data { email, password, name, role }
 * @returns {Promise<object>} Created user object
 */
export const createUser = async (userData) => {
  try {
    const { email, password, name, role = 'attendee' } = userData;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const query = `
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role, created_at, updated_at
    `;

    const user = await selectOne(query, [email, hashedPassword, name, role]);
    return user;
  } catch (err) {
    throw new Error(`Failed to create user: ${err.message}`);
  }
};

// ============================================
// EXPORTS
// ============================================

export default {
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  getUserById,
  getUserByEmail,
  validateCredentials,
  createUser
};
