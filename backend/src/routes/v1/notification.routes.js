import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../../controllers/notification.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:notificationId/read', markAsRead);
router.post('/:notificationId/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

export default router;
