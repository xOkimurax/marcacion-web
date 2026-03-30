import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { googleLogin, getGoogleOAuthUrl, verifyInsforgeToken, getMe } from '../controllers/authController.js';

const router = Router();

// InsForge OAuth nativo
router.get('/oauth/google/url', getGoogleOAuthUrl);
router.post('/verify', verifyInsforgeToken);

// Compatibilidad hacia atrás
router.post('/google', googleLogin);

router.get('/me', authMiddleware, getMe);

export default router;
