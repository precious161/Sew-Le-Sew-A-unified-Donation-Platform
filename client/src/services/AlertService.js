import API from '../api/axios';

/**
 * AlertService Interface
 * Focused strictly on User Management Communication (FR-15).
 */
export const AlertService = {
  /**
   * Operation: SendReminder()
   * Allows Administrators to dispatch manual account-related alerts.
   * Targets specific User IDs in the registry.
   */
  sendReminder: async (targetUserId, message) => {
    try {
      console.log(`[Admin Action] Dispatching alert to User: ${targetUserId}`);
      
      const response = await API.post('/admin/notifications/send', {
        recipientId: targetUserId,
        message: message
      });

      return response.data;
    } catch (error) {
      console.error("AlertService Send Error:", error);
      throw error;
    }
  },

  /**
   * Operation: ReceiveNotification()
   * Provides a feed of system-level alerts for a specific user identity.
   */
  receiveNotifications: async (user) => {
    try {
      // FIX: Using 'user' to fetch specific data (Resolves ESLint Error)
      const userId = user?.UserId || user?.id;
      
      if (!userId) {
        console.warn("AlertService: No valid User Identity provided for fetch.");
        return [];
      }

      console.log(`AlertService: Fetching notification feed for Identity: ${userId}`);

      // Backend call to get real user-specific alerts
      const response = await API.get(`/notifications/${userId}`);
      
      return response.data;

    } catch (error) {
      console.error("AlertService Fetch Error:", error);
      
      // Fallback: If backend is not yet live, we return an empty array 
      // to prevent the UI from crashing during integration testing.
      return [];
    }
  }
};

export default AlertService;