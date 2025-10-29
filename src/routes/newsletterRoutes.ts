import { Router } from 'express';
import { subscribeNewsletter, unsubscribeNewsletter } from '../controllers/newsletterController';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully subscribed
 */
router.post('/subscribe', [
  body('email').isEmail().normalizeEmail(),
  handleValidationErrors
], subscribeNewsletter);

/**
 * @swagger
 * /newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 */
router.post('/unsubscribe', [
  body('email').isEmail().normalizeEmail(),
  handleValidationErrors
], unsubscribeNewsletter);

export default router;