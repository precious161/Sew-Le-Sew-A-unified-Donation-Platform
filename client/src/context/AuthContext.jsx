import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Create the context but do NOT export it here
const AuthContext = createContext();

// 2. Define the Provider
const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      // FIX: Removed 'e' to clear the "defined but never used" warning
      return null;
    }
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'night');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'night' ? 'day' : 'night'));
  };

  const login = (userData) => {
    localStorage.setItem('token', userData.token || 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/dashboard');
  };

  const updateUser = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, theme, toggleTheme, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. EXPORT BOTH AT THE BOTTOM
// This pattern usually bypasses the Vite Fast Refresh warning
export { AuthContext, AuthProvider };
export default AuthProvider;