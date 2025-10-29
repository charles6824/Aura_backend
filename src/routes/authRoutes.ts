import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  registerValidation,
  loginValidation,
  emailValidation,
  changePasswordValidation,
  handleValidationErrors
} from '../middleware/validation';
import { authLimiter } from '../middleware/security';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

// Public routes with rate limiting 
router.post('/register', authLimiter, registerValidation, handleValidationErrors, register);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, emailValidation, handleValidationErrors, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/profile', authenticate as any, getProfile as any);
router.post('/change-password', authenticate as any, changePasswordValidation, handleValidationErrors, changePassword as any);
router.post('/logout', authenticate as any, logout as any);

export default router;