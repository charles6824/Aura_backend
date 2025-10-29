import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { examSecurityMiddleware, proctoringMiddleware } from '../utils/examSecurity';
import {
  startExamSession,
  reportViolation,
  getSessionStatus,
  submitExamAnswers,
  terminateExam
} from '../controllers/examController';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

/**
 * @swagger
 * /exam/start/{examId}:
 *   post:
 *     summary: Start secure exam session
 *     tags: [Exam Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam session started successfully
 *       403:
 *         description: Payment verification required
 *       404:
 *         description: Exam not found or not accessible
 */
router.post('/start/:examId', startExamSession as any);

/**
 * @swagger
 * /exam/violation:
 *   post:
 *     summary: Report security violation
 *     tags: [Exam Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - violationType
 *             properties:
 *               violationType:
 *                 type: string
 *                 enum: [tab_switch, copy_paste, dev_tools, fullscreen_exit, blur, right_click, key_combination]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Violation recorded
 *       403:
 *         description: Exam terminated due to violations
 */
router.post('/violation', examSecurityMiddleware, proctoringMiddleware, reportViolation as any);

/**
 * @swagger
 * /exam/status:
 *   get:
 *     summary: Get exam session status
 *     tags: [Exam Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session status retrieved
 *       404:
 *         description: Session not found
 */
router.get('/status', examSecurityMiddleware, getSessionStatus as any);

/**
 * @swagger
 * /exam/submit:
 *   post:
 *     summary: Submit exam answers
 *     tags: [Exam Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *               - answers
 *             properties:
 *               examId:
 *                 type: string
 *               answers:
 *                 type: object
 *               timeSpent:
 *                 type: number
 *     responses:
 *       200:
 *         description: Exam submitted successfully
 *       403:
 *         description: Invalid or terminated session
 */
router.post('/submit', examSecurityMiddleware, submitExamAnswers as any);

/**
 * @swagger
 * /exam/terminate:
 *   post:
 *     summary: Emergency exam termination
 *     tags: [Exam Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Exam terminated successfully
 */
router.post('/terminate', examSecurityMiddleware, terminateExam as any);

export default router;