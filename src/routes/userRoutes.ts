import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserDashboardStats,
  getUserApplications,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getAvailableAssessments,
  startAssessment,
  submitAssessment
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

/**
 * @swagger
 * /user/assessments/available:
 *   get:
 *     summary: Get available assessments
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available assessments retrieved successfully
 */
router.get('/assessments/available', getAvailableAssessments as any);

/**
 * @swagger
 * /user/assessments/{assessmentId}/start:
 *   post:
 *     summary: Start an assessment
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment started successfully
 */
router.post('/assessments/:assessmentId/start', startAssessment as any);

/**
 * @swagger
 * /user/assessments/{assessmentId}/submit:
 *   post:
 *     summary: Submit assessment answers
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment submitted successfully
 */
router.post('/assessments/:assessmentId/submit', submitAssessment as any);

export default router;