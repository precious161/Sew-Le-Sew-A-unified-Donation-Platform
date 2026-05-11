import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Providers
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeContext'; // NEW
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
// Page Imports
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LandingPage from './pages/landing/LandingPage';
import EventsPage from './pages/EventsPage';
import PlatformPage from './pages/PlatformPage';
// Admin Page Imports
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDonors from './pages/admin/AdminDonors';
import AdminRecipients from './pages/admin/AdminRecipients';
// Donation mgt imports
const HomeRedirect = () => {
const { user } = useAuth();
if (user?.Role === 'Red_Cross_Admin') return <Navigate to="/admin" replace />;
return <Dashboard />;
};
function App() {
return (
<ThemeProvider> {/* WRAP EVERYTHING IN THEME PROVIDER */}
<AuthProvider>
<BrowserRouter>
<Routes>
<Route path="/" element={<LandingPage />} />
<Route path="/events" element={<EventsPage />} />
<Route path="/platform" element={<PlatformPage />} />
<Route path="/signup" element={<SignupPage />} />
<Route path="/login" element={<LoginPage />} />
code
Code
<Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}><HomeRedirect /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Red_Cross_Admin']}><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/donors" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><AdminDonors /></ProtectedRoute>} />
        <Route path="/admin/recipients" element={<ProtectedRoute allowedRoles={['Red_Cross_Admin']}><AdminRecipients /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
</ThemeProvider>
);
}
export default App;
