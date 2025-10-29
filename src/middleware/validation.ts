import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { AppError } from '../utils/AppError';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg
    }));
    
    return next(new AppError('Validation failed', 400, errorMessages));
  }
  next();
};

// Auth validation rules
export const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
];

export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Profile validation rules
export const profileValidation: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('nationality')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nationality must be between 2 and 50 characters'),
  body('currentLocation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Current location must be between 2 and 100 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('skills.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years')
];

// Job validation rules
export const jobValidation: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Job title must be between 5 and 200 characters'),
  body('company')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('salary')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Salary range must be between 5 and 100 characters'),
  body('type')
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
    .withMessage('Job type must be Full-time, Part-time, Contract, or Internship'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('experienceLevel')
    .isIn(['Entry', 'Mid', 'Senior', 'Executive'])
    .withMessage('Experience level must be Entry, Mid, Senior, or Executive'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('benefits')
    .optional()
    .isArray()
    .withMessage('Benefits must be an array')
];

// Application validation rules
export const applicationValidation: ValidationChain[] = [
  body('jobId')
    .isMongoId()
    .withMessage('Please provide a valid job ID'),
  body('coverLetter')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters')
];

// Assessment validation rules
export const assessmentValidation: ValidationChain[] = [
  body('type')
    .isIn(['general', 'technical', 'language', 'personality'])
    .withMessage('Assessment type must be general, technical, language, or personality'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  body('answers.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required for each answer'),
  body('answers.*.answer')
    .notEmpty()
    .withMessage('Answer is required for each question'),
  body('timeSpent')
    .isInt({ min: 1 })
    .withMessage('Time spent must be a positive integer')
];

// Password change validation
export const changePasswordValidation: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Email validation
export const emailValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];