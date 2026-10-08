"use client";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Higher-order component to enforce authentication and role-based access control.
 * Gating rejects unauthorized users and redirects them to their designated portal.
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, initializing } = useAuth();
  const navigate = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (initializing) return;

    if (!isAuthenticated || !user) {
      navigate.replace('/login');
      return;
    }

    const userRole = String(user.role || '').toLowerCase();
    
    // Super admin bypasses all role checks
    if (userRole === 'super_admin') {
      setAuthorized(true);
      return;
    }

    if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
      setAuthorized(true);
    } else {
      // User is authenticated but doesn't have permissions for this portal.
      // Redirect them to their designated home portal.
      switch (userRole) {
        case 'admin':
        case 'finance':
          navigate.replace('/admin');
          break;
        case 'sales':
        case 'marketing':
          navigate.replace('/sales');
          break;
        case 'hr':
          navigate.replace('/hr');
          break;
        case 'project_manager':
          navigate.replace('/delivery');
          break;
        case 'client':
          navigate.replace('/client');
          break;
        case 'partner':
          navigate.replace('/partner');
          break;
        default:
          navigate.replace('/employee');
      }
    }
  }, [isAuthenticated, user, initializing, allowedRoles, navigate]);

  if (initializing || !authorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 font-medium">Verifying VPD security permissions...</p>
        </div>
      </div>
    );
  }

  return children;
}

