import { Request, Response, NextFunction } from 'express';
import Application from '../models/Application';
import Job from '../models/Job';
import Question from '../models/Question';
import WorkflowAssessment from '../models/WorkflowAssessment';
import { AuthRequest } from '../middleware/auth';

export const getCompanyDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.id;

    // Get company jobs
    const jobs = await Job.find({ postedBy: companyId });
    const jobIds = jobs.map(job => job._id);

    // Get applications for company jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('userId', 'name email phone')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 });

    // Calculate statistics
    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.isActive).length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      assessmentPending: applications.filter(app => app.status === 'assessment_pending').length,
      assessmentCompleted: applications.filter(app => app.status === 'assessment_completed').length,
      offersSent: applications.filter(app => app.status === 'offer_sent').length,
      offersAccepted: applications.filter(app => app.status === 'offer_accepted').length,
      inProgress: applications.filter(app => ['documents_pending', 'visa_processing'].includes(app.status)).length,
      completed: applications.filter(app => app.status === 'completed').length
    };

    // Recent applications
    const recentApplications = applications.slice(0, 10);

    // Applications by status
    const applicationsByStatus = {
      pending: applications.filter(app => app.status === 'pending'),
      assessment_pending: applications.filter(app => app.status === 'assessment_pending'),
      assessment_completed: applications.filter(app => app.status === 'assessment_completed'),
      offer_sent: applications.filter(app => app.status === 'offer_sent'),
      offer_accepted: applications.filter(app => app.status === 'offer_accepted'),
      documents_pending: applications.filter(app => app.status === 'documents_pending'),
      visa_processing: applications.filter(app => app.status === 'visa_processing'),
      completed: applications.filter(app => app.status === 'completed'),
      rejected: applications.filter(app => app.status === 'rejected')
    };

    res.json({
      success: true,
      data: {
        stats,
        recentApplications,
        applicationsByStatus,
        jobs
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.id;
    const { status, jobId, page = 1, limit = 10 } = req.query;

    // Get company jobs
    const jobs = await Job.find({ postedBy: companyId });
    const jobIds = jobs.map(job => job._id);

    // Build query
    const query: any = { jobId: { $in: jobIds } };
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    // Get applications with pagination
    const applications = await Application.find(query)
      .populate('userId', 'name email phone skills experience')
      .populate('jobId', 'title company location')
      .sort({ appliedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalApplications: total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionBank = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, type, difficulty } = req.query;

    const query: any = { isActive: true };
    if (category) query.category = category;
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.find(query)
      .select('question type category difficulty points timeLimit tags')
      .sort({ category: 1, difficulty: 1 });

    // Group by category
    const questionsByCategory = questions.reduce((acc: any, question) => {
      if (!acc[question.category]) {
        acc[question.category] = [];
      }
      acc[question.category].push(question);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        questions,
        questionsByCategory,
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId, questionIds, timeLimit, cutoffScore } = req.body;

    // Verify application belongs to company
    const application = await Application.findById(applicationId)
      .populate('jobId', 'postedBy');

    if (!application || (application.jobId as any).postedBy.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized access to application'
      });
      return;
    }

    // Update application
    application.status = 'assessment_pending';
    application.currentStep = 'assessment';
    application.assessmentCutoffScore = cutoffScore;
    application.paymentStatus.assessment = 'required';
    await application.save();

    // Create assessment record
    const assessment = await WorkflowAssessment.create({
      userId: application.userId,
      applicationId: application._id,
      jobId: application.jobId,
      questionIds,
      timeLimit,
      cutoffScore,
      status: 'scheduled',
      scheduledAt: new Date()
    });

    res.json({
      success: true,
      message: 'Assessment created and scheduled',
      data: { assessment, application }
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companyId = req.user!.id;
    const { applicationId } = req.params;

    // Get application and verify ownership
    const application = await Application.findById(applicationId)
      .populate('jobId', 'postedBy title')
      .populate('userId', 'name email');

    if (!application || (application.jobId as any).postedBy.toString() !== companyId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
      return;
    }

    // Get assessment results
    const assessment = await WorkflowAssessment.findOne({ applicationId })
      .populate('questionIds', 'question type category difficulty points');

    res.json({
      success: true,
      data: {
        application,
        assessment,
        score: application.assessmentScore,
        passed: application.assessmentPassed,
        cutoffScore: application.assessmentCutoffScore,
        securityData: application.assessmentSecurityData
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const companyId = req.user!.id;

    // Get application and verify ownership
    const application = await Application.findById(applicationId)
      .populate('jobId', 'postedBy');

    if (!application || (application.jobId as any).postedBy.toString() !== companyId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
      return;
    }

    // Update status
    application.status = status;
    
    // Add notes if provided
    if (notes) {
      application.notes = application.notes || [];
      application.notes.push({
        author: req.user!.id,
        content: notes,
        createdAt: new Date()
      });
    }

    await application.save();

    res.json({
      success: true,
      message: 'Application status updated',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const companyId = req.user!.id;

    const application = await Application.findById(applicationId)
      .populate('userId', 'name email phone skills experience education languages')
      .populate('jobId', 'title company location postedBy')
      .populate('notes.author', 'name role');

    if (!application || (application.jobId as any).postedBy.toString() !== companyId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
      return;
    }

    // Get assessment if exists
    const assessment = await WorkflowAssessment.findOne({ applicationId });

    res.json({
      success: true,
      data: {
        application,
        assessment,
        timeline: generateApplicationTimeline(application)
      }
    });
  } catch (error) {
    next(error);
  }
};

const generateApplicationTimeline = (application: any) => {
  const timeline = [];

  timeline.push({
    event: 'Application Submitted',
    date: application.appliedAt,
    status: 'completed',
    description: `Application submitted for ${(application.jobId as any).title}`
  });

  if (application.status !== 'pending') {
    timeline.push({
      event: 'Application Reviewed',
      date: application.updatedAt,
      status: 'completed',
      description: 'Application reviewed by company'
    });
  }

  if (application.assessmentCompleted) {
    timeline.push({
      event: 'Assessment Completed',
      date: application.updatedAt,
      status: 'completed',
      description: `Assessment score: ${application.assessmentScore}%`
    });
  }

  if (application.status === 'offer_sent') {
    timeline.push({
      event: 'Offer Sent',
      date: application.updatedAt,
      status: 'completed',
      description: 'Employment offer sent to candidate'
    });
  }

  if (application.status === 'offer_accepted') {
    timeline.push({
      event: 'Offer Accepted',
      date: application.updatedAt,
      status: 'completed',
      description: 'Candidate accepted the offer'
    });
  }

  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};