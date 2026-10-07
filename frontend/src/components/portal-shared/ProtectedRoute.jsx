import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Higher-order component to enforce authentication and role-based access control.
 * Gating rejects unauthorized users and redirects them to their designated portal.
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (initializing) return;

    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
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
          navigate('/admin', { replace: true });
          break;
        case 'sales':
        case 'marketing':
          navigate('/sales', { replace: true });
          break;
        case 'hr':
          navigate('/hr', { replace: true });
          break;
        case 'project_manager':
          navigate('/delivery', { replace: true });
          break;
        case 'client':
          navigate('/client', { replace: true });
          break;
        case 'partner':
          navigate('/partner', { replace: true });
          break;
        default:
          navigate('/employee', { replace: true });
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

