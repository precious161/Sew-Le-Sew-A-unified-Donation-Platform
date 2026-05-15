// src/services/AdminService.js
import api from '../api/axios';

const AdminService = {
  monitorActivity: async (page = 1, limit = 20) => {
    const response = await api.get(`/users/admin/monitor?page=${page}&limit=${limit}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/users/admin/status/${userId}`, { status });
    return response.data;
  },

  updateUserRole: async (userId, Role) => {
    const response = await api.patch(`/users/admin/role/${userId}`, { Role });
    return response.data;
  },

  // Identity verification endpoints
  getPendingIdentities: async () => {
    const response = await api.get('/users/admin/identities/pending');
    return response.data;
  },

  reviewIdentity: async (userId, approved, rejectionReason) => {
    const response = await api.patch(`/users/admin/identities/${userId}/review`, {
      approved,
      rejectionReason,
    });
    return response.data;
  },
};

export default AdminService;