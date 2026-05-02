import api from '../api/axios';

const AuthService = {
  //  Signup logic
  signup: async (formData) => {
    const response = await api.post('/auth/signup', formData);
    return response.data;
  },
  
  //  Login logic
  login: async (EmailAddress, Password) => {
    const response = await api.post('/auth/login', { EmailAddress, Password });
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Logout logic
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Backend logout failed:", error.response?.data?.message || error.message);
    } finally {
      // Remove the token from browser
      localStorage.removeItem('token');
      // Send user back to login page
      window.location.href = '/login';
    }
  }
};

export default AuthService;