import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserDashboardStats,
  getUserApplications,
  saveJob,
  unsaveJob,
  getSavedJobs
} from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

/**
 * @swagger
 * /user/dashboard/stats:
 *   get:
 *     summary: Get user dashboard statistics
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard stats retrieved successfully
 */
router.get('/dashboard/stats', getUserDashboardStats as any);

/**
 * @swagger
 * /user/applications:
 *   get:
 *     summary: Get user applications
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User applications retrieved successfully
 */
router.get('/applications', getUserApplications as any);

/**
 * @swagger
 * /user/jobs/{jobId}/save:
 *   post:
 *     summary: Save a job
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job saved successfully
 */
router.post('/jobs/:jobId/save', saveJob as any);

/**
 * @swagger
 * /user/jobs/{jobId}/unsave:
 *   delete:
 *     summary: Unsave a job
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job unsaved successfully
 */
router.delete('/jobs/:jobId/unsave', unsaveJob as any);

/**
 * @swagger
 * /user/saved-jobs:
 *   get:
 *     summary: Get saved jobs
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved jobs retrieved successfully
 */
router.get('/saved-jobs', getSavedJobs as any);

export default router;