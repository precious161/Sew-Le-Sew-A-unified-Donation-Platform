import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';

// --- Temporary Dashboards for testing redirects ---
const DashboardPlaceholder = () => (
  <div className="flex h-screen items-center justify-center flex-col bg-gray-50">
    <h1 className="text-3xl font-bold text-medical-red">User Dashboard</h1>
    <p className="text-gray-600 mt-2">Welcome! This is for Donors and Recipients.</p>
    <button onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }} 
            className="mt-6 text-sm underline text-gray-500">Log Out</button>
  </div>
);

const AdminDashboardPlaceholder = () => (
  <div className="flex h-screen items-center justify-center flex-col bg-slate-900 text-white">
    <h1 className="text-3xl font-bold text-red-500">Admin Panel</h1>
    <p className="opacity-80 mt-2">Welcome, System Administrator.</p>
    <button onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }} 
            className="mt-6 text-sm underline opacity-50">Log Out</button>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Route Targets (We will add the logic later) */}
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/admin" element={<AdminDashboardPlaceholder />} />

          {/* Root Redirect: Start at Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all: If user types a wrong URL, send to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;