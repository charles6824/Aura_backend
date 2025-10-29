import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { generateTokens, generateEmailVerificationToken, generatePasswordResetToken, verifyEmailToken } from '../utils/jwt';
import emailService from '../utils/email';
import cacheService from '../utils/cache';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, company]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      role
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens((user._id as any).toString());

    // Generate email verification token
    const emailVerificationToken = generateEmailVerificationToken((user._id as any).toString());
    user.emailVerificationToken = emailVerificationToken;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, name, emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Account is deactivated. Please contact support.', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens((user._id as any).toString());

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // Check cache first
    const cachedProfile = await cacheService.getCachedUserProfile((req.user!._id as any).toString());
    if (cachedProfile) {
      return res.json({
        success: true,
        data: { user: cachedProfile }
      });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Cache the profile
    await cacheService.cacheUserProfile((user._id as any).toString(), user);

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
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { token } = req.body || req.params;

    const decoded = verifyEmailToken(token);
    if (decoded.type !== 'email_verification') {
      return next(new AppError('Invalid verification token', 400));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.isEmailVerified) {
      res.json({
        success: true,
        message: 'Email is already verified'
      });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Invalidate user cache
    await cacheService.invalidateUserCache((user._id as any).toString());

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      return;
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken((user._id as any).toString());
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, user.name, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { token, password } = req.body;

    const decoded = verifyEmailToken(token);
    if (decoded.type !== 'password_reset') {
      return next(new AppError('Invalid reset token', 400));
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate user cache
    await cacheService.invalidateUserCache((user._id as any).toString());

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 400));
    }

    user.password = newPassword;
    await user.save();

    // Invalidate user cache
    await cacheService.invalidateUserCache((user._id as any).toString());

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};