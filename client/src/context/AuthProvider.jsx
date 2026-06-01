import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/users/profile/me');
      setUser(response.data.data);
    } catch (error) {
      // Clear token on 401 and redirect
      if (error.response?.status === 401) {
        console.log("Session expired or invalid token");
        localStorage.removeItem('token');
        setUser(null);
        // Optionally redirect to login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      } else {
        console.error("Auth check failed:", error.response?.data?.message || error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Add axios interceptor for automatic 401 handling
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const token = localStorage.getItem('token');
          if (token) {
            localStorage.removeItem('token');
            setUser(null);
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};