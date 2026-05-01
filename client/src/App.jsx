import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

const HomeRedirect = () => {
  const { user } = useAuth();
  
  if (user?.Role === 'Red_Cross_Admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* --- PROTECTED USER ROUTES --- */}
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}>
                <HomeRedirect />
              </ProtectedRoute>
            } 
          />

          {/* Profile: Accessible by any verified user */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* --- PROTECTED ADMIN ROUTES --- */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Red_Cross_Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* --- REDIRECTS & CATCH-ALL --- */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;