import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { examSecurityManager } from '../utils/examSecurity';
import Assessment from '../models/Assessment';
import Application from '../models/Application';

/**
 * Start secure exam session
 */
export const startExamSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { examId } = req.params;
    const userId = (req.user!._id as any).toString();

    // Verify user has access to this exam
    const application = await Application.findOne({
      userId,
      status: 'assessment_pending'
    });

    if (!application) {
      return next(new AppError('Exam not found or not accessible', 404));
    }

    // Check if payment is verified
    if (application.paymentStatus.assessment !== 'paid') {
      return next(new AppError('Payment verification required before starting exam', 403));
    }

    // Initialize secure session
    const sessionId = examSecurityManager.initializeSession(userId, examId, req);

    res.json({
      success: true,
      data: {
        sessionId,
        examId,
        securityNotice: 'This exam is monitored for security violations. Any suspicious activity will result in automatic termination.',
        rules: [
          'Do not switch tabs or applications',
          'Do not copy or paste content',
          'Do not use browser developer tools',
          'Do not leave fullscreen mode',
          'Do not use external devices or assistance',
          'Maintain stable internet connection'
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit security violation report
 */
export const reportViolation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const sessionId = (req as any).examSession;
    const { violationType, severity = 'medium', description, metadata } = req.body;

    if (!sessionId) {
      return next(new AppError('No active exam session', 400));
    }

    const terminated = examSecurityManager.recordViolation(sessionId, violationType, severity, description);

    // Log violation with metadata
    console.log(`Security Violation - Session: ${sessionId}, Type: ${violationType}, Severity: ${severity}`, metadata);

    res.json({
      success: true,
      terminated,
      message: terminated ? 'Exam terminated due to security violations' : 'Violation recorded',
      data: {
        violationType,
        severity,
        terminated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get exam session status
 */
export const getSessionStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const sessionId = (req as any).examSession;
    
    if (!sessionId) {
      return next(new AppError('No active exam session', 400));
    }

    const session = examSecurityManager.getSession(sessionId);
    
    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    const violationCounts = session.violations.reduce((counts, violation) => {
      counts[violation.severity]++;
      return counts;
    }, { low: 0, medium: 0, high: 0, critical: 0 });

    res.json({
      success: true,
      data: {
        sessionId,
        isActive: session.isActive,
        startTime: session.startTime,
        violations: violationCounts,
        totalViolations: session.violations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit exam answers with security validation
 */
export const submitExamAnswers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const sessionId = (req as any).examSession;
    const { examId, answers, timeSpent } = req.body;
    const userId = (req.user!._id as any).toString();

    if (!sessionId) {
      return next(new AppError('No active exam session', 400));
    }

    const session = examSecurityManager.getSession(sessionId);
    
    if (!session || !session.isActive) {
      return next(new AppError('Invalid or terminated exam session', 403));
    }

    // Find and update application
    const application = await Application.findOne({
      userId,
      status: 'assessment_pending'
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Update assessment with answers and security data
    application.status = 'assessment_completed';
    application.assessmentCompleted = true;
    application.assessmentSecurityData = {
      violations: session.violations,
      sessionId,
      browserFingerprint: session.browserFingerprint,
      ipAddress: session.ipAddress,
      timeSpent,
      tabSwitches: 0,
      submissionType: 'manual'
    };

    await application.save();

    // Terminate session
    examSecurityManager.terminateSession(sessionId, 'Exam completed successfully');

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        submissionTime: new Date(),
        violationCount: session.violations.length,
        status: 'completed'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Emergency exam termination
 */
export const terminateExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const sessionId = (req as any).examSession;
    const { reason = 'Manual termination' } = req.body;

    if (!sessionId) {
      return next(new AppError('No active exam session', 400));
    }

    examSecurityManager.terminateSession(sessionId, reason);

    res.json({
      success: true,
      message: 'Exam session terminated',
      data: {
        terminationTime: new Date(),
        reason
      }
    });
  } catch (error) {
    next(error);
  }
};