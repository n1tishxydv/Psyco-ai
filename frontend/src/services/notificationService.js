import { apiRequest } from './apiClient.js';

export const notificationService = {
  getNotifications: async () => {
    return apiRequest('/notifications');
  },

  getUnreadCount: async () => {
    return apiRequest('/notifications/unread-count');
  },

  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/mark-all-read', {
      method: 'POST',
    });
  },
};
