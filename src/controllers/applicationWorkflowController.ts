import { Request, Response, NextFunction } from 'express';
import Application from '../models/Application';
import Job from '../models/Job';
import User from '../models/User';
import Question from '../models/Question';
import Assessment from '../models/Assessment';
import Payment from '../models/Payment';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { PDFGenerator } from '../utils/pdfGenerator';
import emailService from '../utils/email';

// Company Actions
export const acceptApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { cutoffScore = 70 } = req.body;

    const application = await Application.findById(applicationId)
      .populate('userId', 'name email')
      .populate('jobId', 'title company');

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Update application status
    application.status = 'assessment_pending';
    application.currentStep = 'assessment';
    application.assessmentCutoffScore = cutoffScore;
    application.paymentStatus.assessment = 'required';
    await application.save();

    // Send notification to user
    await emailService.sendApplicationAcceptedEmail(
      (application.userId as any).email,
      (application.userId as any).name,
      (application.jobId as any).title
    );

    res.json({
      success: true,
      message: 'Application accepted and assessment scheduled',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleAssessment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { questionIds, timeLimit = 3600 } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Create assessment
    const assessment = await Assessment.create({
      userId: application.userId,
      applicationId: application._id,
      jobId: application.jobId,
      questionIds,
      timeLimit,
      status: 'scheduled',
      scheduledAt: new Date()
    });

    res.json({
      success: true,
      message: 'Assessment scheduled successfully',
      data: { assessment }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadOfferLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { salary, startDate, benefits, conditions, expiryDate } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Update offer details
    application.offerDetails = {
      salary,
      startDate: new Date(startDate),
      benefits: benefits || [],
      conditions: conditions || [],
      expiryDate: new Date(expiryDate)
    };
    application.status = 'offer_sent';
    await application.save();

    // Generate offer letter PDF (using employment contract template)
    const user = await User.findById(application.userId);
    const job = await Job.findById(application.jobId);
    const offerLetterPath = await PDFGenerator.generateEmploymentContract(
      user!,
      job!,
      {} as any,
      application
    );

    // Send offer to user
    await emailService.sendApplicationStatusEmail(
      user!.email,
      user!.name,
      (application.jobId as any).title,
      'Company',
      'offer'
    );

    res.json({
      success: true,
      message: 'Offer letter sent successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// User Actions
export const payAssessmentFee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { currency, transactionHash } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user!.id,
      applicationId: application._id,
      step: 'assessment',
      currency,
      transactionHash,
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Payment submitted for verification',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

export const takeAssessment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { answers, timeSpent, securityData } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check if payment is verified
    if (application.paymentStatus.assessment !== 'paid') {
      return next(new AppError('Assessment fee payment required', 402));
    }

    // Calculate score
    const questions = await Question.find({ _id: { $in: answers.map((a: any) => a.questionId) } });
    let totalScore = 0;
    let maxScore = 0;

    answers.forEach((answer: any) => {
      const question = questions.find(q => (q._id as any).toString() === answer.questionId);
      if (question) {
        maxScore += question.points;
        if (question.type === 'objective' && answer.answer === question.correctAnswer) {
          totalScore += question.points;
        }
      }
    });

    const finalScore = Math.round((totalScore / maxScore) * 100);
    const passed = finalScore >= (application.assessmentCutoffScore || 70);

    // Update application
    application.assessmentScore = finalScore;
    application.assessmentCompleted = true;
    application.assessmentPassed = passed;
    application.assessmentSecurityData = securityData;
    application.status = passed ? 'assessment_completed' : 'rejected';
    
    if (passed) {
      application.currentStep = 'document_submission';
      application.paymentStatus.document_processing = 'required';
    } else {
      application.rejectionReason = `Assessment score ${finalScore}% below required ${application.assessmentCutoffScore}%`;
    }

    await application.save();

    // Create assessment record
    await Assessment.create({
      userId: application.userId,
      applicationId: application._id,
      jobId: application.jobId,
      answers,
      score: finalScore,
      maxScore: 100,
      timeSpent,
      status: 'completed',
      completedAt: new Date()
    });

    res.json({
      success: true,
      message: passed ? 'Assessment completed successfully' : 'Assessment failed',
      data: { 
        score: finalScore,
        passed,
        cutoffScore: application.assessmentCutoffScore
      }
    });
  } catch (error) {
    next(error);
  }
};

export const acceptOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { signedDocument } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    if ((application as any).isOfferExpired) {
      return next(new AppError('Offer has expired', 400));
    }

    // Update application
    application.status = 'offer_accepted';
    application.currentStep = 'visa_processing';
    application.paymentStatus.visa_processing = 'required';
    
    // Store signed document
    if (signedDocument) {
      application.generatedDocuments = {
        ...application.generatedDocuments,
        signedContract: signedDocument
      };
    }

    await application.save();

    res.json({
      success: true,
      message: 'Offer accepted successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

export const payVisaProcessingFee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { currency, transactionHash, percentage = 50 } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user!.id,
      applicationId: application._id,
      step: 'visa_processing',
      currency,
      transactionHash,
      status: 'pending',
      metadata: { percentage }
    });

    res.json({
      success: true,
      message: 'Visa processing payment submitted',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

export const submitDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { documents } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check if partial payment is made
    const partialPayment = await Payment.findOne({
      applicationId: application._id,
      step: 'visa_processing',
      status: 'confirmed'
    });

    if (!partialPayment) {
      return next(new AppError('Partial visa processing payment required', 402));
    }

    // Update document status
    application.requiredDocuments = documents;
    application.documentsSubmitted = true;
    application.status = 'documents_pending';
    await application.save();

    // Generate initial documents
    const generatedDocs = await generateInitialDocuments(application);
    application.generatedDocuments = {
      ...application.generatedDocuments,
      ...generatedDocs
    };
    await application.save();

    res.json({
      success: true,
      message: 'Documents submitted successfully',
      data: { application, generatedDocuments: generatedDocs }
    });
  } catch (error) {
    next(error);
  }
};

// Admin Actions
export const verifyDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { verified, notes } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    application.documentsVerified = verified;
    if (verified) {
      application.status = 'visa_processing';
    }

    // Add admin notes
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
      message: verified ? 'Documents verified' : 'Documents require revision',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

export const completeVisaProcessing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check if full payment is completed
    const fullPayment = await Payment.findOne({
      applicationId: application._id,
      step: 'visa_processing',
      status: 'confirmed',
      'metadata.percentage': 100
    });

    if (!fullPayment) {
      return next(new AppError('Full visa processing payment required', 402));
    }

    // Generate all final documents
    const finalDocs = await generateFinalDocuments(application);
    application.generatedDocuments = {
      ...application.generatedDocuments,
      ...finalDocs
    };
    
    application.status = 'completed';
    application.currentStep = 'completed';
    await application.save();

    // Send completion notification
    const user = await User.findById(application.userId);
    await emailService.sendApplicationStatusEmail(
      user!.email,
      user!.name,
      'Position',
      'Company',
      'accepted'
    );

    res.json({
      success: true,
      message: 'Visa processing completed',
      data: { application, finalDocuments: finalDocs }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const generateInitialDocuments = async (application: any) => {
  const docs: any = {};
  
  // Generate employment contract
  docs.employmentContract = await PDFGenerator.generateEmploymentContract(
    application.userId as any,
    application.jobId as any,
    {} as any,
    application
  );
  
  // Generate visa invitation letter
  docs.visaInvitation = await PDFGenerator.generateVisaInvitationLetter(
    application.userId as any,
    application.jobId as any,
    {} as any
  );
  
  return docs;
};

const generateFinalDocuments = async (application: any) => {
  const docs: any = {};
  
  // Generate work permit letter
  docs.workPermitLetter = await PDFGenerator.generateWorkPermitLetter(
    application.userId as any,
    application.jobId as any,
    {} as any
  );
  
  // Generate accommodation letter
  docs.accommodationLetter = await PDFGenerator.generateAccommodationLetter(
    application.userId as any,
    {} as any
  );
  
  // Flight booking generation not implemented yet
  docs.flightBooking = 'flight_booking_placeholder.pdf';
  
  return docs;
};

export const getApplicationProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('userId', 'name email')
      .populate('jobId', 'title company location');

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Get payment status
    const payments = await Payment.find({ applicationId: application._id });

    const progress = {
      application,
      payments,
      currentStep: application.currentStep,
      completionPercentage: calculateCompletionPercentage(application),
      nextAction: getNextAction(application),
      timeline: generateTimeline(application)
    };

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

const calculateCompletionPercentage = (application: any) => {
  const steps = ['application', 'assessment', 'document_submission', 'visa_processing', 'completed'];
  const currentIndex = steps.indexOf(application.currentStep);
  return Math.round(((currentIndex + 1) / steps.length) * 100);
};

const getNextAction = (application: any) => {
  switch (application.currentStep) {
    case 'application':
      return 'Waiting for company review';
    case 'assessment':
      return application.paymentStatus.assessment === 'paid' ? 'Take assessment' : 'Pay assessment fee';
    case 'document_submission':
      return application.paymentStatus.document_processing === 'paid' ? 'Submit documents' : 'Pay document processing fee';
    case 'visa_processing':
      return 'Complete visa processing payment';
    case 'completed':
      return 'Process completed';
    default:
      return 'Unknown';
  }
};

const generateTimeline = (application: any) => {
  return [
    {
      step: 'Application Submitted',
      date: application.appliedAt,
      status: 'completed',
      description: 'Your application has been submitted'
    },
    {
      step: 'Assessment',
      date: application.assessmentCompleted ? application.updatedAt : null,
      status: application.assessmentCompleted ? 'completed' : application.currentStep === 'assessment' ? 'active' : 'pending',
      description: application.assessmentCompleted ? `Score: ${application.assessmentScore}%` : 'Complete skills assessment'
    },
    {
      step: 'Document Submission',
      date: application.documentsSubmitted ? application.updatedAt : null,
      status: application.documentsSubmitted ? 'completed' : application.currentStep === 'document_submission' ? 'active' : 'pending',
      description: 'Submit required documents'
    },
    {
      step: 'Visa Processing',
      date: application.status === 'visa_processing' ? application.updatedAt : null,
      status: application.status === 'visa_processing' ? 'active' : application.status === 'completed' ? 'completed' : 'pending',
      description: 'Visa and work permit processing'
    },
    {
      step: 'Completed',
      date: application.status === 'completed' ? application.updatedAt : null,
      status: application.status === 'completed' ? 'completed' : 'pending',
      description: 'Ready for relocation'
    }
  ];
};