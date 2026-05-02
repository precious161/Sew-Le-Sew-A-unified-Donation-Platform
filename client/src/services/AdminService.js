import api from '../api/axios';

const AdminService = {
  
  monitorActivity: async () => {
    const response = await api.get('/users/admin/monitor');
    return response.data; 
  },

  
  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/users/admin/status/${userId}`, { status });
    return response.data;
  },

  
  updateUserRole: async (userId, Role) => {
    const response = await api.patch(`/users/admin/role/${userId}`, { Role });
    return response.data;
  }
};

export default AdminService;