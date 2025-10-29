import { Router } from 'express';
import {
  createPaymentConfig,
  getAllPaymentConfigs,
  getPaymentConfig,
  updatePaymentConfig,
  updateCryptoWallet,
  togglePaymentConfig,
  getPaymentStats,
  seedDefaultConfigs
} from '../controllers/paymentConfigController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment Configuration
 *   description: Payment configuration management for admin
 */

// Admin only routes
router.use(authenticate as any);
router.use(authorize(['admin']) as any);

// Payment configuration CRUD
router.post('/', createPaymentConfig as any);
router.get('/', getAllPaymentConfigs as any);
router.get('/stats', getPaymentStats as any);
router.get('/:step', getPaymentConfig as any);
router.patch('/:step', updatePaymentConfig as any);
router.patch('/:step/wallet', updateCryptoWallet as any);
router.patch('/:step/toggle', togglePaymentConfig as any);

// Seed default configurations
router.post('/seed', seedDefaultConfigs as any);

export default router;