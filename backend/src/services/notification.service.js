import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { logger } from '../utils/logger.js';

export const notificationService = {
  /**
   * Dispatch a persistent in-app notification to a user.
   * Stored in Realtime Database as text/JSON at notifications/{recipientUid}/{notificationId}.
   */
  notify: async ({
    recipientUid,
    type,
    title,
    message,
    appointmentId = null,
    actionUrl = null,
  }) => {
    if (!recipientUid) return null;

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record = {
      id: notificationId,
      recipientUid,
      type: type || 'appointment_update',
      title,
      message,
      appointmentId,
      actionUrl,
      read: false,
      createdAt: now,
    };

    try {
      await firebaseRtdbAdapter.set(`notifications/${recipientUid}/${notificationId}`, record);
      logger.info(`Notification sent [${type}] to user ${recipientUid}: "${title}"`);
      return record;
    } catch (err) {
      logger.warn(`Failed to persist notification for ${recipientUid}: ${err.message}`);
      return null;
    }
  },

  /**
   * Helper alias supporting sendNotification(recipientUid, payload)
   */
  sendNotification: async (recipientUid, payload = {}) => {
    return notificationService.notify({
      recipientUid,
      type: payload.type || 'system_alert',
      title: payload.title || 'Clinical Alert',
      message: payload.message || '',
      actionUrl: payload.actionUrl || (payload.targetId ? `/risk-review/${payload.targetId}` : null),
    });
  },

  /**
   * Get all notifications for an authenticated user
   */
  getUserNotifications: async (recipientUid) => {
    const records = await firebaseRtdbAdapter.get(`notifications/${recipientUid}`);
    if (!records) return [];

    const list = Object.values(records);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (recipientUid, notificationId) => {
    const existing = await firebaseRtdbAdapter.get(`notifications/${recipientUid}/${notificationId}`);
    if (!existing) return null;

    const updated = { ...existing, read: true, readAt: new Date().toISOString() };
    await firebaseRtdbAdapter.set(`notifications/${recipientUid}/${notificationId}`, updated);
    return updated;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (recipientUid) => {
    const records = await firebaseRtdbAdapter.get(`notifications/${recipientUid}`);
    if (!records) return true;

    const now = new Date().toISOString();
    const updates = {};
    for (const [key, val] of Object.entries(records)) {
      updates[key] = { ...val, read: true, readAt: now };
    }
    await firebaseRtdbAdapter.set(`notifications/${recipientUid}`, updates);
    return true;
  },

  /**
   * Get count of unread notifications
   */
  getUnreadCount: async (recipientUid) => {
    const records = await firebaseRtdbAdapter.get(`notifications/${recipientUid}`);
    if (!records) return 0;
    return Object.values(records).filter((r) => !r.read).length;
  },
};
