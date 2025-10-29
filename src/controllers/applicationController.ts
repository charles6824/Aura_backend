import { Request, Response, NextFunction } from 'express';
import Application from '../models/Application';
import Job from '../models/Job';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { WorkflowManager } from '../utils/workflowManager';
import { PaymentGateway } from '../utils/paymentGateway';
import emailService from '../utils/email';

export const applyToJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { jobId, coverLetter } = req.body;
    const userId = req.user!._id;

    const job = await Job.findById(jobId);
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    const existingApplication = await Application.findOne({ jobId, userId });
    if (existingApplication) {
      return next(new AppError('You have already applied for this job', 400));
    }

    const application = await Application.create({
      jobId,
      userId,
      coverLetter,
      status: 'pending',
      currentStep: 'application',
      assessmentCutoffScore: job.assessmentCutoffScore
    });

    await application.populate(['jobId', 'userId']);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const applications = await Application.find({ userId: req.user!._id })
      .populate('jobId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const applications = await Application.find()
      .populate(['jobId', 'userId'])
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const application = await Application.findById(req.params.id)
      .populate(['jobId', 'userId']);

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check payment gates
    const paymentGates = await WorkflowManager.checkPaymentGates((application._id as any).toString());

    res.json({
      success: true,
      data: { 
        application,
        paymentGates
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (status === 'accepted') {
      await WorkflowManager.processApplicationAcceptance(id);
    } else {
      const application = await Application.findByIdAndUpdate(
        id,
        { status, rejectionReason: feedback },
        { new: true }
      ).populate(['jobId', 'userId']);

      if (!application) {
        return next(new AppError('Application not found', 404));
      }

      // Send rejection email
      const applicant = application.userId as any;
      const job = application.jobId as any;
      
      await emailService.sendApplicationRejectedEmail(
        applicant.email,
        applicant.name,
        job.title,
        feedback
      );
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const getJobApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { jobId } = req.params;

    const applications = await Application.find({ jobId })
      .populate('userId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const application = await Application.findOneAndUpdate(
      { _id: id, userId },
      { status: 'rejected', rejectionReason: 'Withdrawn by applicant' },
      { new: true }
    );

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// New endpoints for payment and workflow management
export const createPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { applicationId, step, currency } = req.body;
    const userId = req.user!._id;

    const paymentResponse = await PaymentGateway.createPayment({
      userId: String(userId),
      applicationId,
      step,
      currency
    });

    res.json({
      success: true,
      data: { payment: paymentResponse }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { paymentId, transactionHash } = req.body;

    const verified = await PaymentGateway.verifyPayment(paymentId, transactionHash);
    
    if (verified) {
      await WorkflowManager.processPaymentConfirmation(paymentId);
    }

    res.json({
      success: true,
      message: verified ? 'Payment verified successfully' : 'Payment verification failed',
      data: { verified }
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssessmentScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { applicationId, score } = req.body;

    await WorkflowManager.processAssessmentCompletion(applicationId, score);

    res.json({
      success: true,
      message: 'Assessment score submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { applicationId, verified } = req.body;

    await WorkflowManager.processDocumentVerification(applicationId, verified);

    res.json({
      success: true,
      message: `Documents ${verified ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const processVisa = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { applicationId } = req.body;

    await WorkflowManager.processVisaProcessing(applicationId);

    res.json({
      success: true,
      message: 'Visa processing started successfully'
    });
  } catch (error) {
    next(error);
  }
};