import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Import the guard

function App() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  console.log("Subsystem Access:", location.pathname, "| Identity:", user?.Role || "Guest");

  return (
    <div className="App">
      <Routes>
        {/* PUBLIC ROUTES: Registration & Account Management */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" replace />} />
        
        {/* PRIVATE ROUTES: Require Login (Donor & Recipient & Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['Donor', 'Recipient', 'Admin']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* ADMIN ONLY ROUTES: Account & Role Control Interface */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin/control" element={<AdminDashboard />} />
        </Route>

        {/* REDIRECTS */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* If user tries a random URL, send them to dashboard if logged in, else login */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;