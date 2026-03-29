import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { markAttendance, getMyHistory, getAttendanceStatus } from '../controllers/attendanceController.js';

const router = Router();

router.use(authMiddleware);

router.post('/mark', markAttendance);
router.get('/history', getMyHistory);
router.get('/status', getAttendanceStatus);

export default router;
