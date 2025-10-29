import { Router } from 'express';
import {
  createCompanyProfile,
  getCompanyProfile,
  updateCompanyProfile,
  getAllCompanies,
  verifyCompany,
  uploadVerificationDocument,
  getCompanyStats
} from '../controllers/companyController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company profile management
 */

// Company profile routes
router.post('/', authenticate as any, authorize(['company']) as any, createCompanyProfile as any);
router.get('/profile', authenticate as any, authorize(['company']) as any, getCompanyProfile as any);
router.patch('/profile', authenticate as any, authorize(['company']) as any, updateCompanyProfile as any);
router.get('/stats', authenticate as any, authorize(['company']) as any, getCompanyStats as any);

// Document upload
router.post('/documents', 
  authenticate as any, 
  authorize(['company']) as any, 
  upload.single('document'), 
  uploadVerificationDocument as any
);

// Admin routes
router.get('/', authenticate as any, authorize(['admin']) as any, getAllCompanies as any);
router.patch('/:companyId/verify', authenticate as any, authorize(['admin']) as any, verifyCompany as any);

export default router;