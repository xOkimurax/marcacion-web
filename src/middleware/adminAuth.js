import { verifyToken } from '../utils/jwt.js';

/**
 * Express middleware that authenticates admin users via Bearer JWT token.
 * Checks that the decoded token has role === 'ADMIN' or isAdmin === true.
 * Attaches the decoded token payload to req.admin on success.
 */
export function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is missing or malformed.',
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }

  if (decoded.role !== 'ADMIN' && decoded.isAdmin !== true) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  req.admin = decoded;
  next();
}
