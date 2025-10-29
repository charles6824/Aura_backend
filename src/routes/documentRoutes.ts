import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  uploadDocument,
  verifyDocument,
  generateDocument,
  getDocuments,
  downloadDocument
} from '../controllers/documentController';

const router = express.Router();

// Protect all routes
router.use(authenticate as any);

// User routes
router.post('/upload', upload.single('document'), uploadDocument as any);
router.get('/', getDocuments as any);
router.get('/:documentId/download/:generatedType?', downloadDocument as any);
router.post('/:documentId/generate/:documentType', generateDocument as any);

// Admin routes
router.patch('/:documentId/verify', authorize(['admin']) as any, verifyDocument as any);

export default router;