import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function ProtectedRoute({ children, allowUnonboarded = false }) {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <LoadingSpinner size="lg" className="text-teal-400 mb-4" />
        <p className="text-sm text-slate-400 animate-pulse">Verifying clinical credentials & session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged into Firebase but hasn't completed onboarding, route them to onboarding
  if (!isOnboarded && !allowUnonboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
