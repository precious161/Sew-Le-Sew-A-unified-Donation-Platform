import api from '../api/axios';

const DonationService = {
    // ─────────────────────────────────────────────────────
    // RECIPIENT SUBSYSTEM
    // ─────────────────────────────────────────────────────

    /**
     * GET: Fetch existing health record.
     * Path synced with latest backend.
     */
    getHealthInfo: async () => {
        const response = await api.get('/donations/recipient/health-info');
        return response.data;
    },

    /**
     * POST: Save or update health record.
     */
    submitHealthInfo: async (healthData) => {
        const response = await api.post('/donations/recipient/health-info', healthData);
        return response.data;
    },

    /**
     * POST: Submit a new donation request.
     * Note: Uses multipart/form-data for the doctor's note upload.
     */
    createDonationRequest: async (formData) => {
        const response = await api.post('/donations/recipient/request', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * GET: Fetch requests created by the logged-in recipient.
     * Feyruza updated this path to /requests/me.
     */
    getMyRequests: async () => {
        const response = await api.get('/donations/recipient/requests/me');
        return response.data;
    },

    /**
     * PATCH: Cancel an existing request.
     */
    cancelRequest: async (requestId) => {
        const response = await api.patch(`/donations/recipient/request/${requestId}/cancel`);
        return response.data;
    },

    // ─────────────────────────────────────────────────────
    // ADMIN SUBSYSTEM (Verification Hub)
    // ─────────────────────────────────────────────────────

    /**
     * GET: Fetch all patient requests awaiting document review.
     */
    getPendingRequests: async (page = 1, limit = 10) => {
        const response = await api.get(`/donations/recipient/requests/pending-verification?page=${page}&limit=${limit}`);
        return response.data;
    },

    /**
     * PATCH: Approve or Reject a request.
     */
    verifyRequest: async (requestId, decisionData) => {
        const response = await api.patch(`/donations/recipient/requests/${requestId}/verify`, decisionData);
        return response.data;
    },

    // ─────────────────────────────────────────────────────
    // DONOR SUBSYSTEM
    // ─────────────────────────────────────────────────────

    /**
     * POST: Send Quiz Answers to Backend Engine.
     */
    checkEligibility: async (category, answers) => {
        const response = await api.post('/donations/donor/check', { category, answers });
        return response.data;
    },

    /**
     * GET: Fetch screening history.
     */
    getEligibilityHistory: async () => {
        const response = await api.get('/donations/donor/eligibilityHistory');
        return response.data;
    },

    /**
     * POST: Register a Donation Pledge.
     * CRITICAL: Feyruza updated this to accept Multipart/FormData (likely for proof).
     */
    registerIntent: async (formData) => {
        const response = await api.post('/donations/donor/register-intent', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * GET: Fetch user's own pledges.
     */
    getMyIntents: async () => {
        const response = await api.get('/donations/donor/my-intents');
        return response.data;
    }
};

export default DonationService;