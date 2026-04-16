import axios from 'axios';

const API = axios.create({
  // Using the /api prefix so it works perfectly with your Vite Proxy
  baseURL: '/api', 
  headers: { 'Content-Type': 'application/json' }
});

// REQUEST INTERCEPTOR: Attaches the JWT "Security Badge"
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR: Handles "The Barrier" (401/403 Errors)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 = Unauthorized (Token expired or missing)
    if (error.response && error.response.status === 401) {
      console.warn("Session expired. Redirecting to login...");
      localStorage.clear();
      window.location.href = '/login'; 
    }
    // 403 = Forbidden (Role not high enough, e.g., Donor trying to hit Admin route)
    if (error.response && error.response.status === 403) {
      console.error("Access Denied: You do not have permission for this action.");
    }
    return Promise.reject(error);
  }
);

export default API;