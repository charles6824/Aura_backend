import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Application from '../models/Application';
import Job from '../models/Job';
import User from '../models/User';
import { ApiResponse } from '../utils/apiResponse';

export const getUserDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const [
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      savedJobs
    ] = await Promise.all([
      Application.countDocuments({ user: userId }),
      Application.countDocuments({ user: userId, status: 'pending' }),
      Application.countDocuments({ user: userId, status: 'accepted' }),
      Application.countDocuments({ user: userId, status: 'rejected' }),
      User.findById(userId).select('savedJobs').then(user => user?.savedJobs?.length || 0)
    ]);

    const stats = {
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      savedJobs
    };

    ApiResponse.success(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    console.error('Get user dashboard stats error:', error);
    ApiResponse.error(res, 'Failed to retrieve dashboard stats', 500);
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ user: userId })
      .populate('job', 'title company location salary')
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments({ user: userId });

    ApiResponse.success(res, {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Applications retrieved successfully');
  } catch (error) {
    console.error('Get user applications error:', error);
    ApiResponse.error(res, 'Failed to retrieve applications', 500);
  }
};

export const saveJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return ApiResponse.error(res, 'Job not found', 404);
    }

    // Add job to user's saved jobs
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedJobs: jobId } },
      { new: true }
    );

    return ApiResponse.success(res, null, 'Job saved successfully');
  } catch (error) {
    console.error('Save job error:', error);
    return ApiResponse.error(res, 'Failed to save job', 500);
  }
};

export const unsaveJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;

    // Remove job from user's saved jobs
    await User.findByIdAndUpdate(
      userId,
      { $pull: { savedJobs: jobId } },
      { new: true }
    );

    return ApiResponse.success(res, null, 'Job unsaved successfully');
  } catch (error) {
    console.error('Unsave job error:', error);
    return ApiResponse.error(res, 'Failed to unsave job', 500);
  }
};

export const getSavedJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'savedJobs',
        populate: {
          path: 'company',
          select: 'name logo'
        },
        options: {
          skip,
          limit,
          sort: { createdAt: -1 }
        }
      });

    const savedJobs = user?.savedJobs || [];
    const total = user?.savedJobs?.length || 0;

    return ApiResponse.success(res, {
      jobs: savedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Saved jobs retrieved successfully');
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return ApiResponse.error(res, 'Failed to retrieve saved jobs', 500);
  }
};