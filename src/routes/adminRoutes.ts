import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAdminStats
} from '../controllers/adminController';
import { handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticate as any);
router.use(requireRole(['admin']) as any);

// User management routes
router.get('/users', getAllUsers as any);
router.post('/users', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').optional().isIn(['user', 'company', 'admin']),
  handleValidationErrors
], createUser as any);
router.put('/users/:id', updateUser as any);
router.delete('/users/:id', deleteUser as any);

// Stats route
router.get('/stats', getAdminStats as any);

export default router;