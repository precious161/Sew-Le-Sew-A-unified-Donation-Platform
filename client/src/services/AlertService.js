import api from '../api/axios';

const AlertService = {
  // ReceiveNotification() - Fetch alerts for the logged-in user
  fetchMyNotifications: async () => {
    const response = await api.get('/users/alerts');
    return response.data; 
  },

  // Mark as Read
  markAsRead: async (id) => {
    const response = await api.patch(`/users/alerts/${id}/read`);
    return response.data;
  },

  // SendReminder() - Admin operation to alert a user
  // THE FIX: Added parameters (userId, message) so they are defined
  sendAlert: async (userId, message) => {
    const response = await api.post('/users/alerts/send', { userId, message });
    return response.data;
  }
};

export default AlertService;