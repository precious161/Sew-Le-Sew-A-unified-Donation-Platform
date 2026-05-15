// src/services/AuthService.js
import api from '../api/axios';

const AuthService = {
  signup: async (formData) => {
    const response = await api.post('/auth/signup', formData);
    // Store token on signup too so user is logged in immediately
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  login: async (EmailAddress, Password) => {
    const response = await api.post('/auth/login', { EmailAddress, Password });
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Backend logout failed:", error.response?.data?.message || error.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },
};

export default AuthService;