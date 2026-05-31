import api from '../api/axios';

const DonationService = {
    // --- DONOR ---
    checkEligibility: async (category, answers) => {
        const response = await api.post('/donations/donor/check', { category, answers });
        return response.data;
    },
    getEligibilityHistory: async () => {
        const response = await api.get('/donations/donor/eligibilityHistory');
        return response.data;
    },
    registerIntent: async (formData) => {
        const response = await api.post('/donations/donor/register-intent', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getDonationHistory: async () => {
        const response = await api.get('/donations/donor/history/my-history');
        return response.data;
    },

    getMyIntents: async () => {
        const response = await api.get('/donations/donor/my-intents');
        return response.data;
    },

    cancelIntent: async (intentId) => {
        const response = await api.patch(`/donations/donor/${intentId}/cancel`);
        return response.data;
    },

    // --- RECIPIENT ---
    getHealthInfo: async () => {
        const response = await api.get('/donations/recipient/health-info');
        return response.data;
    },
    submitHealthInfo: async (healthData) => {
        const response = await api.post('/donations/recipient/health-info', healthData);
        return response.data;
    },
    createDonationRequest: async (formData) => {
        const response = await api.post('/donations/recipient/request', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getMyRequests: async () => {
        const response = await api.get('/donations/recipient/requests/me');
        return response.data;
    },

    // --- ADMIN QUEUE MANAGEMENT ---
    getPendingRequests: async (page = 1) => {
        const response = await api.get(`/donations/recipient/requests/pending-verification?page=${page}`);
        return response.data;
    },
    getApprovedFinancialRequests: async (page = 1) => {
        const response = await api.get(`/donations/recipient/requests/financial-approved?page=${page}`);
        return response.data;
    },
    verifyRequest: async (requestId, decisionData) => {
        const response = await api.patch(`/donations/recipient/requests/${requestId}/verify`, decisionData);
        return response.data;
    },
    getPendingIntents: async (page = 1) => {
        const response = await api.get(`/donations/donor/pending?page=${page}`);
        return response.data;
    },
    verifyDonorIntent: async (intentId, decisionData) => {
        const response = await api.patch(`/donations/donor/${intentId}/verify`, decisionData);
        return response.data;
    },
    cancelDonationRequest: async (requestId) => {
        const response = await api.patch(`/donations/recipient/request/${requestId}/cancel`);
        return response.data;
    }
};

export default DonationService;