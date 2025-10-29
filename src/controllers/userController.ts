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
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('jobId', 'title company location salary')
      .populate('companyId', 'name logo')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(query);

    return ApiResponse.success(res, applications, 'Applications retrieved successfully');
  } catch (error) {
    console.error('Get user applications error:', error);
    return ApiResponse.error(res, 'Failed to retrieve applications', 500);
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

export const getAvailableAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Get user's applications that have assessments
    const applications = await Application.find({ 
      userId, 
      status: { $in: ['assessment_pending', 'assessment_completed'] }
    })
    .populate('jobId', 'title company');

    const assessments = applications.map(app => ({
      _id: `assessment_${app._id}`,
      jobId: app.jobId,
      status: (app as any).assessmentCompleted ? 'completed' : 'available',
      questionCount: 10,
      timeLimit: 3600,
      cutoffScore: 70,
      score: (app as any).assessmentScore,
      passed: (app as any).assessmentPassed,
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }));

    return ApiResponse.success(res, { assessments }, 'Available assessments retrieved successfully');
  } catch (error) {
    console.error('Get available assessments error:', error);
    return ApiResponse.error(res, 'Failed to retrieve assessments', 500);
  }
};

export const startAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user?.id;

    // Mock assessment start - in real app, this would create a session
    const assessment = {
      _id: assessmentId,
      status: 'in_progress',
      startedAt: new Date(),
      questions: [
        {
          _id: '1',
          question: 'What is the primary purpose of object-oriented programming?',
          type: 'multiple_choice',
          options: ['To write faster code', 'To organize code into reusable objects', 'To reduce memory usage', 'To eliminate bugs'],
          points: 10
        },
        {
          _id: '2', 
          question: 'Explain the concept of database normalization.',
          type: 'essay',
          points: 15
        }
      ]
    };

    return ApiResponse.success(res, { assessment }, 'Assessment started successfully');
  } catch (error) {
    console.error('Start assessment error:', error);
    return ApiResponse.error(res, 'Failed to start assessment', 500);
  }
};

export const submitAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const { answers, timeSpent, securityData } = req.body;
    const userId = req.user?.id;

    // Mock scoring - in real app, this would calculate actual score
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
    const passed = score >= 70;

    // Update application with assessment results
    await Application.updateMany(
      { userId, _id: assessmentId.replace('assessment_', '') },
      {
        $set: {
          assessmentCompleted: true,
          assessmentScore: score,
          assessmentPassed: passed,
          status: passed ? 'assessment_completed' : 'rejected'
        }
      }
    );

    return ApiResponse.success(res, {
      score,
      passed,
      timeSpent,
      submittedAt: new Date()
    }, 'Assessment submitted successfully');
  } catch (error) {
    console.error('Submit assessment error:', error);
    return ApiResponse.error(res, 'Failed to submit assessment', 500);
  }
};