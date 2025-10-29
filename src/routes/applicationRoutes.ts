import { Router } from 'express';
import {
  applyToJob,
  getUserApplications,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  getJobApplications,
  withdrawApplication,
  createPayment,
  verifyPayment,
  submitAssessmentScore,
  verifyDocuments,
  processVisa
} from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';
import { applicationValidation, handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job application management
 */

// User routes
router.post('/', authenticate as any, applicationValidation, handleValidationErrors, applyToJob as any);
router.get('/', authenticate as any, getUserApplications as any);
router.get('/:id', authenticate as any, getApplicationById as any);
router.patch('/:id/withdraw', authenticate as any, withdrawApplication as any);

// Payment routes
router.post('/payment', authenticate as any, createPayment as any);
router.post('/payment/verify', authenticate as any, verifyPayment as any);

// Assessment and workflow routes
router.post('/assessment/score', authenticate as any, authorize(['company', 'admin']) as any, submitAssessmentScore as any);
router.post('/documents/verify', authenticate as any, authorize(['company', 'admin']) as any, verifyDocuments as any);
router.post('/visa/process', authenticate as any, authorize(['company', 'admin']) as any, processVisa as any);

// Admin/Company routes
router.get('/all', authenticate as any, authorize(['admin']) as any, getAllApplications as any);
router.patch('/:id/status', authenticate as any, authorize(['admin', 'company']) as any, updateApplicationStatus as any);
router.get('/job/:jobId', authenticate as any, authorize(['admin', 'company']) as any, getJobApplications as any);

export default router;