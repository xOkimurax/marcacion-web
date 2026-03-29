import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/auth.js';
import {
  getDashboardToday,
  getFullHistory,
  getEmployees,
  createEmployee,
  updateEmployee,
  getLocation,
  updateLocation,
  getFailedAttempts,
  exportReport,
} from '../controllers/adminController.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/dashboard', getDashboardToday);
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.patch('/employees/:id', updateEmployee);
router.get('/attendance', getFullHistory);
router.get('/failed-attempts', getFailedAttempts);
router.get('/location', getLocation);
router.put('/location', updateLocation);
router.get('/reports', exportReport);

export default router;
