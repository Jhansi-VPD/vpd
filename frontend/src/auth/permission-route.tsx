import React from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from './auth.context';
import { hasPermission } from '../shared/hooks/usePermissions';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
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

  const allowed = hasPermission(user.role, permission);
  if (!allowed) {
    redirect('/auth/unauthorized'); return null;
  }

  return <>{children}</>;
};

export default PermissionRoute;



