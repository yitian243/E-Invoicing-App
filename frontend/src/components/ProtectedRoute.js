import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isTokenValid } = useAuth();
  
  // Check if user is authenticated and token is valid
  if (!isAuthenticated || !isTokenValid()) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // Render the child routes
  return <Outlet />;
};

export default ProtectedRoute;