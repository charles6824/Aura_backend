import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getUserDashboardStats,
  getCompanyDashboardStats,
  getAdminDashboardStats,
  getUserNotifications,
  markNotificationRead
} from '../controllers/dashboardController';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

/**
 * @swagger
 * /dashboard/user/stats:
 *   get:
 *     summary: Get user dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard stats retrieved successfully
 */
router.get('/user/stats', getUserDashboardStats as any);

/**
 * @swagger
 * /dashboard/company/stats:
 *   get:
 *     summary: Get company dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company dashboard stats retrieved successfully
 */
router.get('/company/stats', requireRole(['company']) as any, getCompanyDashboardStats as any);

/**
 * @swagger
 * /dashboard/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard stats retrieved successfully
 */
router.get('/admin/stats', requireRole(['admin']) as any, getAdminDashboardStats as any);

/**
 * @swagger
 * /dashboard/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/notifications', getUserNotifications as any);

/**
 * @swagger
 * /dashboard/notifications/{notificationId}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.post('/notifications/:notificationId/read', markNotificationRead as any);

export default router;