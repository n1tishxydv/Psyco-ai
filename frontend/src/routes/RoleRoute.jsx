import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../components/cards/Card';
import { Button } from '../components/common/Button';

export function RoleRoute({ allowedRoles = [], children }) {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <LoadingSpinner size="lg" className="text-teal-400 mb-4" />
        <p className="text-sm text-slate-400">Checking role permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 border-red-500/20 bg-slate-900/60">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your account role (<span className="text-teal-400 font-mono capitalize">{role || 'unassigned'}</span>)
            is not authorized to access this section.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                if (role === 'patient') window.location.href = '/patient/dashboard';
                else if (role === 'psychologist') window.location.href = '/psychologist/dashboard';
                else if (role === 'admin') window.location.href = '/admin/dashboard';
                else window.location.href = '/';
              }}
            >
              Go to My Workspace
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/'}>
              Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return children;
}
