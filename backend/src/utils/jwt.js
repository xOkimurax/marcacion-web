import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

/**
 * Signs a JWT token with the given payload.
 * @param {object} payload - Data to encode in the token
 * @returns {string} Signed JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a JWT token and returns its decoded payload.
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
