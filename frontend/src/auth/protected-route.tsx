import React from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from './auth.context';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect('/auth/login'); return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;



