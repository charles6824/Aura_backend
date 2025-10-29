import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import cacheService from '../utils/cache';

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = await User.findById(req.user!._id as any);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               currentLocation:
 *                 type: string
 *               preferredCountries:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: number
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *               languages:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const allowedFields = [
      'name', 'phone', 'dateOfBirth', 'nationality', 'currentLocation',
      'preferredCountries', 'skills', 'experience', 'education', 'languages'
    ];

    const updateData: any = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user!._id as any,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Invalidate cache
    await cacheService.invalidateUserCache((user._id as any).toString());

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /profile/upload-document:
 *   post:
 *     summary: Upload profile document
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [passport, resume, certificate, other]
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const { type } = req.body;
    if (!type || !['passport', 'resume', 'certificate', 'other'].includes(type)) {
      return next(new AppError('Invalid document type', 400));
    }

    // In production, upload to Cloudinary or S3
    const documentUrl = `/uploads/${req.file.filename}`;

    const user = await User.findById(req.user!._id as any);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.documents = user.documents || [];
    user.documents.push({
      type,
      url: documentUrl,
      name: req.file.originalname,
      uploadedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: {
          type,
          url: documentUrl,
          name: req.file.originalname
        }
      }
    });
  } catch (error) {
    next(error);
  }
};