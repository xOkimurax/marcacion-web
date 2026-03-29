import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
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

// Apply admin auth middleware to all routes in this router
router.use(adminAuthMiddleware);

// GET /api/admin/dashboard - Today's attendance summary
router.get('/dashboard', getDashboardToday);

// GET /api/admin/attendance - Full attendance history with filters
router.get('/attendance', getFullHistory);

// GET /api/admin/employees - List all employees
router.get('/employees', getEmployees);

// POST /api/admin/employees - Create a new employee
router.post('/employees', createEmployee);

// PUT /api/admin/employees/:id - Update an employee
router.put('/employees/:id', updateEmployee);

// GET /api/admin/location - Get current location configuration
router.get('/location', getLocation);

// PUT /api/admin/location - Update location configuration
router.put('/location', updateLocation);

// GET /api/admin/failed-attempts - Get failed attendance attempts
router.get('/failed-attempts', getFailedAttempts);

// GET /api/admin/export - Export attendance report as CSV
router.get('/export', exportReport);

export default router;
