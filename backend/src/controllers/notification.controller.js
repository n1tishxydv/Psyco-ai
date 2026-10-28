import { successResponse } from '../utils/apiResponse.js';
import { notificationService } from '../services/notification.service.js';

export async function getNotifications(req, res, next) {
  try {
    const list = await notificationService.getUserNotifications(req.user.uid);
    const unreadCount = list.filter((n) => !n.read).length;
    return successResponse(res, { notifications: list, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user.uid);
    return successResponse(res, { unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    const updated = await notificationService.markAsRead(req.user.uid, notificationId);
    return successResponse(res, { notification: updated });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.uid);
    return successResponse(res, { message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}
