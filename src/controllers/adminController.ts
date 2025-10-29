import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
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
      role,
      isEmailVerified: true // Admin created users are auto-verified
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow password updates through this endpoint
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true, role: 'user' });
    const totalCompanies = await User.countDocuments({ isActive: true, role: 'company' });
    const totalAdmins = await User.countDocuments({ isActive: true, role: 'admin' });
    const recentUsers = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCompanies,
          totalAdmins,
          totalActive: totalUsers + totalCompanies + totalAdmins
        },
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};