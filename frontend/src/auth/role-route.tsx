import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth.context';

interface RoleRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const role = String(user.role || '').toLowerCase();
  const isAllowed = allowedRoles.includes(role) || role === 'super_admin';

  if (!isAllowed) {
    return <Navigate to="/auth/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;

