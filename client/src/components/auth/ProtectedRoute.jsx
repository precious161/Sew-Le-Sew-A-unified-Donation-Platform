import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Importing from hooks, not context

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check roles (matching Feyruza's exact string names)
  if (allowedRoles && !allowedRoles.includes(user.Role)) {
    // If Admin accidentally hits /dashboard or Donor hits /admin
    const fallback = user.Role === 'Red_Cross_Admin' ? '/admin' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;