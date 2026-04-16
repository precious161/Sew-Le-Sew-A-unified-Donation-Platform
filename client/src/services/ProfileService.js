import API from '../api/axios'; // Import the central instance with interceptors

/**
 * Profile Management Subsystem
 * Strictly following the architectural logic for User Profile updates.
 */
const ProfileService = {
  
  /**
   * Task: ViewProfile
   * Matches Documentation: getUserProfile(userId)
   */
  getUserProfile: async (userId) => {
    try {
      console.log(`[Profile Service] Fetching data for Identity: ${userId}`);
      
      const response = await API.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("ProfileService: Fetch Error", error?.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Task: UpdateProfile
   * Matches Documentation: updateProfile(userId, data)
   * Note: This sends the JWT automatically via the Axios interceptor.
   */
  updateProfile: async (userId, data) => {
    try {
      console.log(`[Profile Service] Synchronizing updates for Identity: ${userId}`);
      
      // We use the central API instance to ensure the Token is in the header
      const response = await API.put(`/users/${userId}`, data);
      
      return response.data;
    } catch (error) {
      console.error("ProfileService: Update Error", error?.response?.data || error.message);
      throw error;
    }
  }
};

export default ProfileService;