import api from '../api/axios';

const DonationService = {
    // ── RECIPIENT ENDPOINTS ──
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

    // ── DONOR ENDPOINTS ──
    checkEligibility: async (category, answers) => {
        // Backend expects { category, answers }
        const response = await api.post('/donations/donor/check', { category, answers });
        return response.data;
    },
    getEligibilityHistory: async () => {
        const response = await api.get('/donations/donor/eligibilityHistory');
        return response.data;
    },
    registerIntent: async (formData) => {
        // Backend now expects FormData because Organ intents require a medical document!
        const response = await api.post('/donations/donor/register-intent', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default DonationService;