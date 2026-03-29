import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  markAttendance,
  getMyHistory,
} from '../controllers/attendanceController.js';

const router = Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// POST /api/attendance/mark - Mark attendance (ENTRY or EXIT)
router.post('/mark', markAttendance);

// GET /api/attendance/history - Get authenticated user's attendance history
router.get('/history', getMyHistory);

export default router;
