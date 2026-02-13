import { Router } from 'express';
import { getNotifications, markAsRead, createBulkNotifications, getSentNotifications } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.get('/', authenticate, getNotifications);
router.get('/sent', authenticate, getSentNotifications);
router.post('/bulk', authenticate, createBulkNotifications);
router.put('/:id/read', authenticate, markAsRead);

export default router;
