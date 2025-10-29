import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getCompanyDashboard,
  getCompanyApplications,
  getQuestionBank,
  createAssessment,
  getAssessmentResults,
  updateApplicationStatus,
  getApplicationDetails
} from '../controllers/companyDashboardController';

const router = express.Router();

router.use(authenticate as any);
router.use(requireRole(['company']) as any);

// Dashboard routes
router.get('/dashboard', getCompanyDashboard as any);
router.get('/applications', getCompanyApplications as any);
router.get('/applications/:applicationId', getApplicationDetails as any);
router.patch('/applications/:applicationId/status', updateApplicationStatus as any);

// Assessment routes
router.get('/questions', getQuestionBank as any);
router.post('/assessments', createAssessment as any);
router.get('/assessments/:applicationId/results', getAssessmentResults as any);

export default router;