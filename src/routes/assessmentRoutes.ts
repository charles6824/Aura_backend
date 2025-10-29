import { Router } from 'express';
import {
  getAssessmentQuestions,
  submitAssessment,
  getAssessmentResults,
  getAssessmentStats
} from '../controllers/assessmentController';
import { authenticate } from '../middleware/auth';
import { assessmentValidation, handleValidationErrors } from '../middleware/validation';
import { assessmentLimiter } from '../middleware/security';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Assessments
 *   description: Assessment and testing system
 */

// All assessment routes require authentication
router.use(authenticate as any);

// Get assessment questions
router.get('/questions', getAssessmentQuestions as any);

// Submit assessment with rate limiting
router.post('/submit', assessmentLimiter, assessmentValidation, handleValidationErrors, submitAssessment as any);

// Get assessment results
router.get('/results', getAssessmentResults as any);

// Get assessment statistics
router.get('/stats', getAssessmentStats as any);

export default router;