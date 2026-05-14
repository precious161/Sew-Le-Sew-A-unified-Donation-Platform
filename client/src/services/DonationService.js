import api from '../api/axios';

const DonationService = {
    checkEligibility: async (category, answers) => {
        const response = await api.post('/donations/donor/check', { category, answers });
        return response.data;
    },

    getEligibilityHistory: async () => {
        const response = await api.get('/donations/donor/eligibilityHistory');
        return response.data;
    },

    // NEW: Matches router.post("/register-intent", ...)
    registerIntent: async (intentData) => {
        const response = await api.post('/donations/donor/register-intent', intentData);
        return response.data;
    },

    // NEW: Matches router.get("/my-intents", ...)
    getMyIntents: async () => {
        const response = await api.get('/donations/donor/my-intents');
        return response.data;
    }
};

export default DonationService;