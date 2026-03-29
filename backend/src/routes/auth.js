import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import {
  googleLogin,
  adminLogin,
  getMe,
  getAdminMe,
} from '../controllers/authController.js';

const router = Router();

// POST /api/auth/ - Google OAuth login
router.post('/', googleLogin);

// POST /api/auth/admin/login - Admin username/password login
router.post('/admin/login', adminLogin);

// GET /api/auth/me - Get current authenticated user info
router.get('/me', authMiddleware, getMe);

// GET /api/auth/admin/me - Get current authenticated admin info
router.get('/admin/me', adminAuthMiddleware, getAdminMe);

export default router;
