// src/services/AlertService.js
import api from '../api/axios';

const AlertService = {
  fetchMyNotifications: async () => {
    const response = await api.get('/users/alerts');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/users/alerts/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/users/alerts/read-all');
    return response.data;
  },

  sendAlert: async (userId, message) => {
    const response = await api.post('/users/alerts/send', { userId, message });
    return response.data;
  },
};

export default AlertService;