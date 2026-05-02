import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Logic & Security Imports
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Page Imports
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

/**
 * HomeRedirect Component:
 * Strictly enforces the Access Control Matrix at the entry point.
 * - Red_Cross_Admin: Pushed to the Admin Management Panel (/admin).
 * - Donor/Recipient: Shown the User Overview Dashboard (/dashboard).
 */
const HomeRedirect = () => {
  const { user } = useAuth();
  
  // Exact string match for Feyruza's Backend Enum
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
          {/* Access Control: SignUp is only for Donors/Recipients (Handled in the Page) */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* --- PROTECTED USER ROUTES --- */}
          {/* 
            The /dashboard path acts as a gateway. 
            HomeRedirect ensures Admins are kicked out to /admin 
            so they never see the Donor "Hello" card.
          */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}>
                <HomeRedirect />
              </ProtectedRoute>
            } 
          />

          {/* 
             Profile: Accessible by all authenticated users for "ViewProfile()".
             Internal logic in Profile.jsx handles "UpdateProfile()" restrictions for Admin.
          */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* --- PROTECTED ADMIN ROUTES --- */}
          {/* Access Control: Only the Authority role can enter the Registry Control */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Red_Cross_Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* --- SYSTEM REDIRECTS --- */}
          {/* Start at Login if no session exists */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch-all safety: Redirects any unknown URL back to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;