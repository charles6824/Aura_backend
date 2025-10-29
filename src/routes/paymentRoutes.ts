import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createPayment,
  verifyPayment,
  getPaymentHistory,
  getPaymentConfig,
  updatePaymentConfig
} from '../controllers/paymentController';

const router = express.Router();

// Protect all routes
router.use(authenticate as any);

// User routes
router.post('/create', createPayment as any);
router.post('/verify', verifyPayment as any);
router.get('/history', getPaymentHistory as any);
router.get('/config', getPaymentConfig as any);

// Admin routes
router.patch('/config/:step', authorize(['admin']) as any, updatePaymentConfig as any);

export default router;