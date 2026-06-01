import axios from 'axios';

// Safely get the API URL from environment variables, fallback to localhost
let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Bulletproof fix: If the URL ends with a slash, remove it first
if (apiUrl.endsWith('/')) {
  apiUrl = apiUrl.slice(0, -1);
}

// Bulletproof fix: If the URL does NOT end with '/api', add it.
// This fixes the 404 errors when calling endpoints like /auth/login
if (!apiUrl.endsWith('/api')) {
  apiUrl = `${apiUrl}/api`;
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (status === 403) {
      const message = error.response?.data?.message || '';
      if (message.includes('deactivated')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;