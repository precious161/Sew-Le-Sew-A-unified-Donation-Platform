import api from '../api/axios';

const AuthService = {
  //  Signup logic
  signup: async (formData) => {
    const response = await api.post('/auth/signup', formData);
    return response.data;
  },
  
 // Login logic
  login: async (EmailAddress, Password) => {
    
    const response = await api.post('/auth/login', { EmailAddress, Password });
    
    
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response.data;
  },

  // Added Logout for later use
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

export default AuthService;