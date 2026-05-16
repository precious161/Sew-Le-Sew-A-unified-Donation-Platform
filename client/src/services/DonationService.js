import api from '../api/axios';

const DonationService = {
  // Matches: router.get("/", ...) mounted at /recipient
  getHealthInfo: async () => {
    const response = await api.get('/donations/recipient'); 
    return response.data;
  },

  // Matches: router.post("/", ...) mounted at /recipient
  submitHealthInfo: async (healthData) => {
    const response = await api.post('/donations/recipient', healthData);
    return response.data;
  },

  /**
   * POST: Create Support Request
   * Matches: router.post("/request", ...) mounted at /donations/recipient
   * URL: /api/donations/recipient/request
   */
  createDonationRequest: async (formData) => {
    const response = await api.post('/donations/recipient/request', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get('/donations/recipient/requests/me');
    return response.data;
  }
};

export default DonationService;