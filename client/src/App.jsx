import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Shared Pages
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LandingPage from './pages/landing/LandingPage';
import EventsPage from './pages/EventsPage';
import PlatformPage from './pages/PlatformPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDonors from './pages/admin/AdminDonors';
import AdminRecipients from './pages/admin/AdminRecipients';
import AdminIdentities from './pages/admin/AdminIdentities';
import RequestVerification from './pages/admin/RequestVerification'; // NEW

// Recipient Subsystem
import HealthInfo from './pages/donations/recipient/HealthInfo';
import CreateRequest from './pages/donations/recipient/CreateRequest';
import MyRequests from './pages/donations/recipient/MyRequests'; 

// Donor Subsystem
import EligibilityQuiz from './pages/donations/donor/EligibilityQuiz';
import RegisterIntent from './pages/donations/donor/RegisterIntent';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.Role === 'Red_Cross_Admin') return <Navigate to="/admin" replace />;
  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/platform" element={<PlatformPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* SHARED PROTECTED ROUTES */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}><HomeRedirect /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}><Profile /></ProtectedRoute>} />

            {/* RECIPIENT SUBSYSTEM */}
            <Route path="/donations/recipient/health-info" element={<ProtectedRoute allowedRoles={['Recipient']}><HealthInfo /></ProtectedRoute>} />
            <Route path="/donations/recipient/request" element={<ProtectedRoute allowedRoles={['Recipient']}><CreateRequest /></ProtectedRoute>} />

            {/* DONOR SUBSYSTEM */}
            <Route path="/donations/donor/check" element={<ProtectedRoute allowedRoles={['Donor']}><EligibilityQuiz /></ProtectedRoute>} />
            <Route path="/donations/donor/register-intent" element={<ProtectedRoute allowedRoles={['Donor']}><RegisterIntent /></ProtectedRoute>} />

            {/* ADMIN SYSTEM ROUTES */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/donors" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><AdminDonors /></ProtectedRoute>} />
            <Route path="/admin/recipients" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><AdminRecipients /></ProtectedRoute>} />
            <Route path="/admin/identities" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><AdminIdentities /></ProtectedRoute>} />
            <Route path="/admin/requests" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><RequestVerification /></ProtectedRoute>} /> {/* NEW */}

            {/* CATCH-ALL REDIRECT */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;