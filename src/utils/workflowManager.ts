import Application, { IApplication } from '../models/Application';
import Payment from '../models/Payment';
import emailService from './email';
import { PDFGenerator } from './pdfGenerator';
import User from '../models/User';
import Job from '../models/Job';
import Company from '../models/Company';

export class WorkflowManager {
  static async processApplicationAcceptance(applicationId: string): Promise<void> {
    const application = await Application.findById(applicationId)
      .populate('userId')
      .populate('jobId');

    if (!application) {
      throw new Error('Application not found');
    }

    // Update application status
    application.status = 'accepted';
    application.currentStep = 'assessment';
    application.paymentStatus.assessment = 'required';
    application.paymentGates.assessmentBlocked = true;
    
    await application.save();

    // Send acceptance email with payment instructions
    await emailService.sendApplicationAcceptedEmail(
      (application.userId as any).email,
      (application.userId as any).name,
      (application.jobId as any).title
    );
  }

  static async processPaymentConfirmation(paymentId: string): Promise<void> {
    const payment = await Payment.findById(paymentId)
      .populate('applicationId')
      .populate('userId');

    if (!payment || payment.status !== 'confirmed') {
      throw new Error('Payment not confirmed');
    }

    const application = await Application.findById(payment.applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Update payment status and unblock next step
    switch (payment.step) {
      case 'assessment':
        application.paymentStatus.assessment = 'paid';
        application.paymentGates.assessmentBlocked = false;
        application.status = 'assessment_pending';
        break;
      
      case 'document_verification':
        application.paymentStatus.document_processing = 'paid';
        application.paymentGates.documentSubmissionBlocked = false;
        application.status = 'documents_pending';
        application.currentStep = 'document_submission';
        break;
      
      case 'visa_processing':
        application.paymentStatus.visa_processing = 'paid';
        application.paymentGates.visaProcessingBlocked = false;
        application.status = 'visa_processing';
        application.currentStep = 'visa_processing';
        break;
    }

    await application.save();

    // Send payment confirmation email
    await emailService.sendApplicationStatusEmail(
      (payment.userId as any).email,
      (payment.userId as any).name,
      'Payment Confirmed',
      'Employment Platform',
      'accepted'
    );
  }

  static async processAssessmentCompletion(
    applicationId: string, 
    score: number
  ): Promise<void> {
    const application = await Application.findById(applicationId)
      .populate('userId')
      .populate('jobId');

    if (!application) {
      throw new Error('Application not found');
    }

    const job = application.jobId as any;
    const user = application.userId as any;

    application.assessmentScore = score;
    application.assessmentCompleted = true;
    application.assessmentPassed = score >= job.assessmentCutoffScore;

    if (application.assessmentPassed) {
      application.status = 'assessment_completed';
      
      // Generate assessment certificate
      const certificateFileName = await PDFGenerator.generateAssessmentCertificate(
        user, job, score
      );
      
      // Send congratulatory email with employment offer
      await emailService.sendApplicationStatusEmail(
        user.email,
        user.name,
        job.title,
        job.company,
        'offer'
      );

      // Set up document processing payment requirement
      application.paymentStatus.document_processing = 'required';
      application.paymentGates.documentSubmissionBlocked = true;
      
    } else {
      application.status = 'rejected';
      
      // Send rejection email
      await emailService.sendApplicationRejectedEmail(
        user.email,
        user.name,
        job.title,
        `Assessment score: ${score}/${job.assessmentCutoffScore}`
      );
    }

    await application.save();
  }

  static async processDocumentSubmission(applicationId: string): Promise<void> {
    const application = await Application.findById(applicationId)
      .populate('userId')
      .populate('jobId');

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if all required documents are submitted
    const allDocumentsSubmitted = Object.values(application.requiredDocuments || {})
      .every(submitted => submitted);

    if (allDocumentsSubmitted) {
      application.documentsSubmitted = true;
      application.status = 'documents_pending';
      
      // Generate employment documents
      await this.generateEmploymentDocuments(application);
      
      await application.save();

      // Notify company to review documents
      await emailService.sendApplicationStatusEmail(
        'company@example.com',
        (application.userId as any).name,
        (application.jobId as any).title,
        'Employment Platform',
        'reviewing'
      );
    }
  }

  static async processDocumentVerification(
    applicationId: string, 
    verified: boolean
  ): Promise<void> {
    const application = await Application.findById(applicationId)
      .populate('userId')
      .populate('jobId');

    if (!application) {
      throw new Error('Application not found');
    }

    application.documentsVerified = verified;

    if (verified) {
      application.status = 'offer_sent';
      application.paymentStatus.visa_processing = 'required';
      application.paymentGates.visaProcessingBlocked = true;

      // Send employment offer
      await emailService.sendApplicationStatusEmail(
        (application.userId as any).email,
        (application.userId as any).name,
        (application.jobId as any).title,
        (application.jobId as any).company,
        'offer'
      );
    } else {
      application.status = 'rejected';
      
      await emailService.sendApplicationRejectedEmail(
        (application.userId as any).email,
        (application.userId as any).name,
        (application.jobId as any).title,
        'Document verification failed'
      );
    }

    await application.save();
  }

  static async processVisaProcessing(applicationId: string): Promise<void> {
    const application = await Application.findById(applicationId)
      .populate('userId')
      .populate('jobId');

    if (!application) {
      throw new Error('Application not found');
    }

    application.status = 'visa_processing';
    application.currentStep = 'relocation';
    
    // Generate visa and relocation documents
    const user = application.userId as any;
    const job = application.jobId as any;
    const company = await Company.findOne({ userId: job.postedBy });

    if (company) {
      const visaInvitation = await PDFGenerator.generateVisaInvitationLetter(user, job, company);
      const workPermit = await PDFGenerator.generateWorkPermitLetter(user, job, company);
      const accommodation = await PDFGenerator.generateAccommodationLetter(user, company);

      application.generatedDocuments = {
        visaInvitation,
        workPermitLetter: workPermit,
        accommodationLetter: accommodation
      };
    }

    await application.save();

    // Send visa processing confirmation
    await emailService.sendApplicationStatusEmail(
      user.email,
      user.name,
      job.title,
      job.company,
      'accepted'
    );
  }

  private static async generateEmploymentDocuments(application: IApplication): Promise<void> {
    const user = await User.findById(application.userId);
    const job = await Job.findById(application.jobId);
    const company = await Company.findOne({ userId: job?.postedBy });

    if (user && job && company) {
      const contractFileName = await PDFGenerator.generateEmploymentContract(
        user, job, company, application
      );
      
      if (!application.generatedDocuments) {
        application.generatedDocuments = {};
      }
      application.generatedDocuments.employmentContract = contractFileName;
    }
  }

  private static getNextStepMessage(step: string): string {
    switch (step) {
      case 'assessment':
        return 'You can now take your assessment';
      case 'document_verification':
        return 'You can now submit your documents';
      case 'visa_processing':
        return 'Visa processing will begin shortly';
      default:
        return 'Next step will be communicated soon';
    }
  }

  static async checkPaymentGates(applicationId: string): Promise<{
    canTakeAssessment: boolean;
    canSubmitDocuments: boolean;
    canProcessVisa: boolean;
  }> {
    const application = await Application.findById(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    return {
      canTakeAssessment: !application.paymentGates.assessmentBlocked,
      canSubmitDocuments: !application.paymentGates.documentSubmissionBlocked,
      canProcessVisa: !application.paymentGates.visaProcessingBlocked
    };
  }
}