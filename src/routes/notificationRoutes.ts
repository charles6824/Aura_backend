import { Router } from 'express';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate as any, getNotifications as any);
router.patch('/:id/read', authenticate as any, markAsRead as any);
router.delete('/:id', authenticate as any, deleteNotification as any);

export default router;