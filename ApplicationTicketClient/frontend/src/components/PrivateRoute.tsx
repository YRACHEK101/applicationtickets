import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  element: React.ReactElement;
  roles?: string[];
  fallback?: React.ReactElement; // Optional fallback component for role-based redirection
}

export default function PrivateRoute({ element, roles, fallback }: PrivateRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have the required role
  if (roles && !roles.includes(user.role)) {
    // If a fallback is provided, render it instead
    if (fallback) {
      return fallback;
    }
    // Otherwise redirect to the dashboard
    return <Navigate to="/" replace />;
  }

  return element;
}