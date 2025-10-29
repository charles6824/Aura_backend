import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

interface SecurityViolation {
  type: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface ExamSession {
  userId: string;
  examId: string;
  startTime: Date;
  violations: SecurityViolation[];
  isActive: boolean;
  browserFingerprint: string;
  ipAddress: string;
  userAgent: string;
}

class ExamSecurityManager {
  private activeSessions: Map<string, ExamSession> = new Map();
  private readonly MAX_VIOLATIONS = {
    low: 10,
    medium: 5,
    high: 3,
    critical: 1
  };

  // Initialize secure exam session
  initializeSession(userId: string, examId: string, req: Request): string {
    const sessionId = `${userId}_${examId}_${Date.now()}`;
    const session: ExamSession = {
      userId,
      examId,
      startTime: new Date(),
      violations: [],
      isActive: true,
      browserFingerprint: this.generateBrowserFingerprint(req),
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };

    this.activeSessions.set(sessionId, session);
    return sessionId;
  }

  // Generate browser fingerprint for session validation
  private generateBrowserFingerprint(req: Request): string {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    return Buffer.from(`${userAgent}${acceptLanguage}${acceptEncoding}`).toString('base64');
  }

  // Record security violation
  recordViolation(sessionId: string, type: string, severity: SecurityViolation['severity'], description: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const violation: SecurityViolation = {
      type,
      timestamp: new Date(),
      severity,
      description
    };

    session.violations.push(violation);

    // Check if exam should be terminated
    const violationCounts = this.getViolationCounts(session.violations);
    
    if (violationCounts.critical >= this.MAX_VIOLATIONS.critical ||
        violationCounts.high >= this.MAX_VIOLATIONS.high ||
        violationCounts.medium >= this.MAX_VIOLATIONS.medium ||
        violationCounts.low >= this.MAX_VIOLATIONS.low) {
      
      this.terminateSession(sessionId, 'Maximum violations exceeded');
      return true; // Session terminated
    }

    return false; // Session continues
  }

  // Get violation counts by severity
  private getViolationCounts(violations: SecurityViolation[]) {
    return violations.reduce((counts, violation) => {
      counts[violation.severity]++;
      return counts;
    }, { low: 0, medium: 0, high: 0, critical: 0 });
  }

  // Terminate exam session
  terminateSession(sessionId: string, reason: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.recordViolation(sessionId, 'session_terminated', 'critical', reason);
    }
  }

  // Validate session integrity
  validateSession(sessionId: string, req: Request): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    // Check browser fingerprint
    const currentFingerprint = this.generateBrowserFingerprint(req);
    if (currentFingerprint !== session.browserFingerprint) {
      this.recordViolation(sessionId, 'browser_change', 'critical', 'Browser fingerprint mismatch');
      return false;
    }

    // Check IP address
    const currentIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (currentIP !== session.ipAddress) {
      this.recordViolation(sessionId, 'ip_change', 'high', 'IP address changed during exam');
    }

    return true;
  }

  // Get session data
  getSession(sessionId: string): ExamSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): void {
    const now = new Date();
    const FOUR_HOURS = 4 * 60 * 60 * 1000;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now.getTime() - session.startTime.getTime() > FOUR_HOURS) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

export const examSecurityManager = new ExamSecurityManager();

// Middleware for exam security
export const examSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-exam-session'] as string;
  
  if (!sessionId) {
    return next(new AppError('Exam session required', 400));
  }

  if (!examSecurityManager.validateSession(sessionId, req)) {
    return next(new AppError('Invalid or compromised exam session', 403));
  }

  (req as any).examSession = sessionId;
  next();
};

// Proctoring middleware
export const proctoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const sessionId = (req as any).examSession;
  const violationType = req.body.violationType;
  const severity = req.body.severity || 'medium';
  const description = req.body.description || 'Security violation detected';

  if (sessionId && violationType) {
    const terminated = examSecurityManager.recordViolation(sessionId, violationType, severity, description);
    
    if (terminated) {
      res.status(403).json({
        success: false,
        message: 'Exam terminated due to security violations',
        terminated: true
      });
      return;
    }
  }

  next();
};

export default examSecurityManager;