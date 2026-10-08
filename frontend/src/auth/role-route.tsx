"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth.context';

const ROLE_HOME: Record<string, string> = {
  super_admin: '/admin',
  admin: '/admin',
  finance: '/admin',
  sales: '/sales',
  marketing: '/sales',
  hr: '/hr',
  project_manager: '/delivery',
  client: '/client',
  employee: '/employee',
};

export function roleHome(role: string | null | undefined): string {
  return ROLE_HOME[String(role || '').toLowerCase()] || '/employee';
}

function GuardScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 font-medium">Verifying VPD security permissions...</p>
      </div>
    </div>
  );
}

interface RoleRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const role = String(user?.role || '').toLowerCase();
  const home = roleHome(role);
  // home === pathname keeps unknown roles usable inside their fallback portal
  // instead of looping replace() back to the same URL.
  const authorized =
    !isLoading &&
    isAuthenticated &&
    !!user &&
    (role === 'super_admin' || allowedRoles.includes(role) || home === pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/auth/login');
      return;
    }
    if (!authorized && pathname !== home) {
      router.replace(home);
    }
  }, [isLoading, isAuthenticated, user, authorized, pathname, home, router]);

  if (!authorized) return <GuardScreen />;
  return <>{children}</>;
};

export default RoleRoute;
