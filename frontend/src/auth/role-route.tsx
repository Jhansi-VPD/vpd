import React from 'react';
import { redirect } from 'next/navigation';
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
    redirect('/auth/login'); return null;
  }

  const role = String(user.role || '').toLowerCase();
  const isAllowed = allowedRoles.includes(role) || role === 'super_admin';

  if (!isAllowed) {
    redirect('/auth/unauthorized'); return null;
  }

  return <>{children}</>;
};

export default RoleRoute;



