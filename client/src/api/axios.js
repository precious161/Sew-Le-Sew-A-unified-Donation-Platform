import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // <--- Change this to just '/api'
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;