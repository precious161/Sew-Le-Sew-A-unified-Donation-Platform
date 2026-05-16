import api from '../api/axios';

const DonationService = {
    // ─────────────────────────────────────────────────────
    // RECIPIENT SUBSYSTEM
    // ─────────────────────────────────────────────────────

    getHealthInfo: async () => {
        const response = await api.get('/donations/recipient/medical-profile');
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
        const response = await api.get('/donations/recipient/request');
        return response.data;
    },

    cancelRequest: async (requestId) => {
        const response = await api.patch(`/donations/recipient/request/${requestId}/cancel`);
        return response.data;
    },

    // ─────────────────────────────────────────────────────
    // ADMIN SUBSYSTEM (Verification Hub)
    // ─────────────────────────────────────────────────────

    /**
     * GET: Fetch all patient requests awaiting document review.
     * Matches backend: DonationRequestController.getPendingVerificationRequests
     */
    getPendingRequests: async (page = 1, limit = 10) => {
        const response = await api.get(`/donations/recipient/requests/pending-verification?page=${page}&limit=${limit}`);
        return response.data;
    },

    /**
     * PATCH: Approve or Reject a request.
     * Matches backend: DonationRequestController.verifyDonationRequest
     * payload: { approved: boolean, rejectionReason: string, correctedUrgencyLevel: string }
     */
    verifyRequest: async (requestId, decisionData) => {
        const response = await api.patch(`/donations/recipient/requests/${requestId}/verify`, decisionData);
        return response.data;
    },

    // ─────────────────────────────────────────────────────
    // DONOR SUBSYSTEM
    // ─────────────────────────────────────────────────────

    checkEligibility: async (category, answers) => {
        const response = await api.post('/donations/donor/check', { category, answers });
        return response.data;
    },

    getEligibilityHistory: async () => {
        const response = await api.get('/donations/donor/eligibilityHistory');
        return response.data;
    },

    registerIntent: async (intentData) => {
        const response = await api.post('/donations/donor/register-intent', intentData);
        return response.data;
    },

    getMyIntents: async () => {
        const response = await api.get('/donations/donor/my-intents');
        return response.data;
    }
};

export default DonationService;