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
  delivery: '/delivery',
  client: '/client',
  employee: '/employee',
};

// 'partner' is intentionally absent: there is no partner portal yet, so
// partner-role users fall through to the employee home.
const PORTAL_HOME: Record<string, string> = {
  admin: '/admin',
  sales: '/sales',
  hr: '/hr',
  delivery: '/delivery',
  employee: '/employee',
  client: '/client',
};

export function roleHome(role: string | null | undefined, portal?: string | null): string {
  const roleKey = String(role || '').toLowerCase();
  if (ROLE_HOME[roleKey]) return ROLE_HOME[roleKey];
  const portalKey = String(portal || '').toLowerCase();
  return PORTAL_HOME[portalKey] || '/employee';
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
  const portal = String(user?.portal || '').toLowerCase();
  const home = roleHome(role, user?.portal);
  // home === pathname keeps unknown roles usable inside their fallback portal
  // instead of looping replace() back to the same URL.
  const authorized =
    !isLoading &&
    isAuthenticated &&
    !!user &&
    (role === 'super_admin' ||
      role === 'admin' ||
      allowedRoles.includes(role) ||
      (!!portal && allowedRoles.includes(portal)) ||
      home === pathname);

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
