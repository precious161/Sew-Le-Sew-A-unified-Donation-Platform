import api from '../api/axios';

const DonationService = {
    // 1. RECIPIENT: Get existing health info
    getHealthInfo: async () => {
        const response = await api.get('/donations/recipient/health-info');
        return response.data;
    },

    // 2. RECIPIENT: Save/Update health info
    submitHealthInfo: async (healthData) => {
        const response = await api.post('/donations/recipient/health-info', healthData);
        return response.data;
    },

    // 3. RECIPIENT: Submit a support request (Doctor note upload)
    createDonationRequest: async (formData) => {
        const response = await api.post('/donations/recipient/request', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // 4. RECIPIENT: Get my active requests
    getMyRequests: async () => {
        const response = await api.get('/donations/recipient/requests/me');
        return response.data;
    }
};

export default DonationService;