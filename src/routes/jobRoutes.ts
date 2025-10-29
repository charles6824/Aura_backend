import { Router } from 'express';
import {
  getJobs,
  getJobMatches,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobStats
} from '../controllers/jobController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { jobValidation, handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management and matching
 */

// Public routes
router.get('/', optionalAuth as any, getJobs as any);
router.get('/stats', getJobStats as any);
router.get('/:id', getJobById as any);

// Protected routes
router.get('/matches/me', authenticate as any, getJobMatches as any);

// Admin/Company only routes
router.post('/', authenticate as any, authorize(['admin', 'company']) as any, jobValidation, handleValidationErrors, createJob as any);
router.put('/:id', authenticate as any, authorize(['admin', 'company']) as any, jobValidation, handleValidationErrors, updateJob as any);
router.delete('/:id', authenticate as any, authorize(['admin', 'company']) as any, deleteJob as any);

export default router;