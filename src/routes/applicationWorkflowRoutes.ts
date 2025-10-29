import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  acceptApplication,
  scheduleAssessment,
  uploadOfferLetter,
  payAssessmentFee,
  takeAssessment,
  acceptOffer,
  payVisaProcessingFee,
  submitDocuments,
  verifyDocuments,
  completeVisaProcessing,
  getApplicationProgress
} from '../controllers/applicationWorkflowController';

const router = express.Router();

router.use(authenticate as any);

// Company routes
router.patch('/company/:applicationId/accept', requireRole(['company']) as any, acceptApplication as any);
router.post('/company/:applicationId/schedule-assessment', requireRole(['company']) as any, scheduleAssessment as any);
router.post('/company/:applicationId/offer', requireRole(['company']) as any, uploadOfferLetter as any);

// User routes
router.post('/user/:applicationId/pay-assessment', requireRole(['user']) as any, payAssessmentFee as any);
router.post('/user/:applicationId/take-assessment', requireRole(['user']) as any, takeAssessment as any);
router.post('/user/:applicationId/accept-offer', requireRole(['user']) as any, acceptOffer as any);
router.post('/user/:applicationId/pay-visa', requireRole(['user']) as any, payVisaProcessingFee as any);
router.post('/user/:applicationId/submit-documents', requireRole(['user']) as any, submitDocuments as any);

// Admin routes
router.patch('/admin/:applicationId/verify-documents', requireRole(['admin']) as any, verifyDocuments as any);
router.post('/admin/:applicationId/complete-visa', requireRole(['admin']) as any, completeVisaProcessing as any);

// Common routes
router.get('/:applicationId/progress', getApplicationProgress as any);

export default router;