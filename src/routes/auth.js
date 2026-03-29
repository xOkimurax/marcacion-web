import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { googleLogin, getMe } from '../controllers/authController.js';

const router = Router();

router.post('/google', googleLogin);
router.get('/me', authMiddleware, getMe);

export default router;
