import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

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
      // Feyruza's route: /api/users/profile/me
      const response = await api.get('/users/profile/me');
      setUser(response.data.data); 
    } catch {
      // Removed 'error' here to fix the unused variable warning
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // checkAuth is now stable because of useCallback

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};