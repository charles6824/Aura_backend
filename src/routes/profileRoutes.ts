import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getProfile,
  updateProfile,
  uploadDocument
} from '../controllers/profileController';
import { authenticate } from '../middleware/auth';
import { profileValidation, handleValidationErrors } from '../middleware/validation';
import { fileUploadSecurity } from '../middleware/security';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

// All profile routes require authentication
router.use(authenticate as any);

// Profile routes
router.get('/', getProfile as any);
router.put('/', profileValidation, handleValidationErrors, updateProfile as any);
router.post('/upload-document', upload.single('file'), fileUploadSecurity, uploadDocument as any);

export default router;