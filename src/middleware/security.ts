import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

export const assessmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 assessment attempts per hour
  message: {
    success: false,
    message: 'Too many assessment attempts, please try again later.'
  },
});

// CORS configuration
export const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// IP whitelist middleware (for admin routes)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (process.env.NODE_ENV === 'development') {
      return next(); // Skip IP check in development
    }
    
    if (allowedIPs.includes(clientIP as string)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
  };
};

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential XSS attempts
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// File upload security middleware
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction): void => {
  if (req.file) {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'File type not allowed'
      });
      return;
    }

    if (req.file.size > maxSize) {
      res.status(400).json({
        success: false,
        message: 'File size too large'
      });
      return;
    }
  }

  next();
};