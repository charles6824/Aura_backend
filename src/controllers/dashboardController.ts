import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import User from '../models/User';
import Job from '../models/Job';
import Application from '../models/Application';
import Company from '../models/Company';

/**
 * Get user dashboard statistics
 */
export const getUserDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = (req.user!._id as any).toString();

    // Get user applications
    const applications = await Application.find({ userId }).populate('jobId');
    
    // Get available jobs count
    const totalJobs = await Job.countDocuments({ isActive: true });
    
    // Calculate stats
    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      acceptedApplications: applications.filter(app => app.status === 'accepted').length,
      assessmentsPending: applications.filter(app => app.status === 'assessment_pending').length,
      documentsRequired: applications.filter(app => app.status === 'documents_pending').length,
      visaProcessing: applications.filter(app => app.status === 'visa_processing').length,
      totalJobs,
      profileCompletion: calculateProfileCompletion(req.user!)
    };

    // Get recent applications
    const recentApplications = applications
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, 5);

    // Get recommended jobs (simplified matching)
    const recommendedJobs = await Job.find({ isActive: true })
      .populate('companyId')
      .limit(5)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        stats,
        recentApplications,
        recommendedJobs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get company dashboard statistics
 */
export const getCompanyDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = (req.user!._id as any).toString();

    // Get company profile
    const company = await Company.findOne({ userId });
    if (!company) {
      return next(new AppError('Company profile not found', 404));
    }

    // Get company jobs
    const jobs = await Job.find({ companyId: company._id });
    const jobIds = jobs.map(job => job._id);

    // Get applications for company jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('userId', 'name email')
      .populate('jobId', 'title');

    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.isActive).length,
      totalApplications: applications.length,
      pendingReview: applications.filter(app => app.status === 'pending').length,
      assessmentsToReview: applications.filter(app => app.status === 'assessment_completed').length,
      documentsToVerify: applications.filter(app => app.status === 'documents_pending').length,
      offersToSend: applications.filter(app => app.status === 'accepted').length
    };

    // Get recent applications
    const recentApplications = applications
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        stats,
        recentApplications,
        company
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true, role: 'user' });
    const totalCompanies = await User.countDocuments({ isActive: true, role: 'company' });
    const totalJobs = await Job.countDocuments({ isActive: true });
    const totalApplications = await Application.countDocuments();

    // Get recent activity
    const recentUsers = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentApplications = await Application.find()
      .populate('userId', 'name email')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 })
      .limit(10);

    // Payment statistics
    const paymentsRequired = await Application.countDocuments({
      $or: [
        { 'paymentGates.assessmentBlocked': true },
        { 'paymentGates.documentSubmissionBlocked': true },
        { 'paymentGates.visaProcessingBlocked': true }
      ]
    });

    const stats = {
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      paymentsRequired,
      systemHealth: 'operational'
    };

    res.json({
      success: true,
      data: {
        stats,
        recentUsers,
        recentApplications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate profile completion percentage
 */
function calculateProfileCompletion(user: any): number {
  const fields = [
    'name',
    'email',
    'phone',
    'location',
    'skills',
    'experience',
    'education',
    'resume'
  ];

  let completedFields = 0;
  
  fields.forEach(field => {
    if (user[field] && user[field].length > 0) {
      completedFields++;
    }
  });

  return Math.round((completedFields / fields.length) * 100);
}

/**
 * Get user notifications
 */
export const getUserNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = (req.user!._id as any).toString();

    // Get applications that need attention
    const applications = await Application.find({ userId })
      .populate('jobId', 'title company');

    const notifications: any[] = [];

    // Check for payment requirements
    applications.forEach(app => {
      const job = app.jobId as any;
      
      if (app.paymentGates?.assessmentBlocked) {
        notifications.push({
          type: 'payment_required',
          title: 'Payment Required',
          message: `Assessment payment required for ${job?.title || 'Job'}`,
          applicationId: app._id,
          priority: 'high'
        });
      }
      
      if (app.status === 'assessment_pending') {
        notifications.push({
          type: 'assessment_ready',
          title: 'Assessment Ready',
          message: `Your assessment for ${job?.title || 'Job'} is ready to take`,
          applicationId: app._id,
          priority: 'medium'
        });
      }

      if (app.status === 'documents_pending') {
        notifications.push({
          type: 'documents_required',
          title: 'Documents Required',
          message: `Please submit required documents for ${job?.title || 'Job'}`,
          applicationId: app._id,
          priority: 'high'
        });
      }
    });

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { notificationId } = req.params;
    
    // In a real implementation, you would update the notification status in the database
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};