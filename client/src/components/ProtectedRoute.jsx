import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    // Not logged in? Redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.Role)) {
    // Role mismatch? Redirect to unauthorized or dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and role matches, render the page
  return <Outlet />;
};

export default ProtectedRoute;