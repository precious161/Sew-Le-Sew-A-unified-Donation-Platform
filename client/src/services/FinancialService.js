import api from '../api/axios';

const FinancialService = {
  // Check if donor is eligible to contribute (verified identity)
  checkEligibility: async () => {
    const response = await api.get('/matching/financial/eligibility');
    return response.data;
  },

  // Submit a financial contribution
  submitContribution: async (formData) => {
    const response = await api.post('/matching/financial/contribute', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get donor's contribution history
  getMyContributions: async () => {
    const response = await api.get('/matching/financial/my-contributions');
    return response.data;
  },

  // Admin: Get all contributions
  getAllContributions: async (page = 1, limit = 20) => {
    const response = await api.get(`/matching/financial?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Admin: Get pending contributions
  getPendingContributions: async (page = 1, limit = 20) => {
    const response = await api.get(`/matching/financial/pending?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Admin: Review contribution (approve/reject)
  reviewContribution: async (id, approved, rejectionReason) => {
    const response = await api.patch(`/matching/financial/${id}/review`, { approved, rejectionReason });
    return response.data;
  },

  // Admin: Allocate contribution
  allocateContribution: async (id, allocationNote) => {
    const response = await api.patch(`/matching/financial/${id}/allocate`, { allocationNote });
    return response.data;
  },

  // Admin: Distribute to recipient
  distributeToRecipient: async (contributionId, requestId, amount, note) => {
    const response = await api.patch(`/matching/financial/${contributionId}/distribute/${requestId}`, { amount, note });
    return response.data;
  },
};

export default FinancialService;