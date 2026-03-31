import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { googleLogin, getGoogleOAuthUrl, verifyInsforgeToken, exchangeCode, getMe } from '../controllers/authController.js';

const router = Router();

// InsForge OAuth nativo
router.get('/oauth/google/url', getGoogleOAuthUrl);
router.post('/verify', verifyInsforgeToken);
router.post('/exchange', exchangeCode);

// Compatibilidad hacia atrás
router.post('/google', googleLogin);

router.get('/me', authMiddleware, getMe);

export default router;
