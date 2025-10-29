import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import Database from './config/database';
import logger from './config/logger';
import swaggerSpecs from './config/swagger';
import { globalErrorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter, corsOptions, helmetConfig, sanitizeInput } from './middleware/security';

// Import routes
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import applicationRoutes from './routes/applicationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import documentRoutes from './routes/documentRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import profileRoutes from './routes/profileRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import paymentConfigRoutes from './routes/paymentConfigRoutes';
import companyRoutes from './routes/companyRoutes';
import examRoutes from './routes/examRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import newsletterRoutes from './routes/newsletterRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(sanitizeInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Employment Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Employment Platform API Documentation',
  customfavIcon: '/favicon.ico'
}));

// API Routes
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/jobs`, jobRoutes);
app.use(`${API_PREFIX}/applications`, applicationRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/documents`, documentRoutes);
app.use(`${API_PREFIX}/assessments`, assessmentRoutes);
app.use(`${API_PREFIX}/profile`, profileRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/payment-config`, paymentConfigRoutes);
app.use(`${API_PREFIX}/companies`, companyRoutes);
app.use(`${API_PREFIX}/exam`, examRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/newsletter`, newsletterRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Employment Platform API',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    version: '1.0.0',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      jobs: `${API_PREFIX}/jobs`,
      applications: `${API_PREFIX}/applications`
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
let server: any;

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        await Database.disconnect();
        logger.info('Database connections closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Error name:', err.name);
  logger.error('Error message:', err.message);
  logger.error('Error stack:', err.stack);
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await Database.connectMongoDB();
    await Database.connectRedis();

    // Create logs directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;