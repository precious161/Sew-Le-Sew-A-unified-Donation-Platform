import api from '../api/axios';

const MatchingService = {
  // Normalize category names (e.g. 'In_Kind' becomes 'inkind')
  _getPath: (category) => category.toLowerCase().replace('_', ''),

  runMatchingEngine: async (category) => {
    const response = await api.post(`/matching/${MatchingService._getPath(category)}/run`);
    return response.data;
  },

  getMatches: async (category) => {
    const response = await api.get(`/matching/${MatchingService._getPath(category)}`);
    return response.data;
  },

  completeDonation: async (category, matchId) => {
    const response = await api.patch(`/matching/${MatchingService._getPath(category)}/${matchId}/complete`);
    return response.data;
  },

  getMyActiveMatch: async () => {
    const response = await api.get('/matching/my-active-match');
    return response.data;
  },

  respondToMatch: async (category, matchId, accepted) => {
    const response = await api.patch(`/matching/${MatchingService._getPath(category)}/${matchId}/respond`, { accepted });
    return response.data;
  }
};

export default MatchingService;