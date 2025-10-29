import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAdminStats
} from '../controllers/adminController';
import {
  getAnalytics,
  getPaymentAnalytics
} from '../controllers/adminAnalyticsController';
import {
  getDocuments,
  deleteDocument,
  getDocumentTemplates
} from '../controllers/adminDocumentController';
import {
  getMessages,
  getMessage,
  markAsRead,
  sendMessage,
  deleteMessage
} from '../controllers/adminMessageController';
import {
  getSettings,
  updateSetting,
  resetSettings,
  getSystemInfo
} from '../controllers/adminSettingsController';
import {
  getAllPayments,
  adminVerifyPayment,
  adminRejectPayment,
  requestPaymentRetry
} from '../controllers/paymentController';
import {
  adminGetAllCompanies,
  adminApproveCompany,
  adminDeleteCompany,
  adminUpdateCompany
} from '../controllers/companyController';
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

// Analytics routes
router.get('/analytics', getAnalytics as any);
router.get('/analytics/payments', getPaymentAnalytics as any);

// Document management routes
router.get('/documents', getDocuments as any);
router.delete('/documents/:filename', deleteDocument as any);
router.get('/document-templates', getDocumentTemplates as any);

// Message management routes
router.get('/messages', getMessages as any);
router.get('/messages/:id', getMessage as any);
router.patch('/messages/:id/read', markAsRead as any);
router.post('/messages', sendMessage as any);
router.delete('/messages/:id', deleteMessage as any);

// Settings management routes
router.get('/settings', getSettings as any);
router.patch('/settings/:id', updateSetting as any);
router.post('/settings/reset', resetSettings as any);
router.get('/system-info', getSystemInfo as any);

// Payment management routes
router.get('/payments', getAllPayments as any);
router.patch('/payments/:id/verify', adminVerifyPayment as any);
router.patch('/payments/:id/reject', adminRejectPayment as any);
router.patch('/payments/:id/retry', requestPaymentRetry as any);

// Company management routes
router.get('/companies', adminGetAllCompanies as any);
router.patch('/companies/:id/approve', adminApproveCompany as any);
router.put('/companies/:id', adminUpdateCompany as any);
router.delete('/companies/:id', adminDeleteCompany as any);

export default router;