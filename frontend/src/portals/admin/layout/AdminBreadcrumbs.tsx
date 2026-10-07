import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export const AdminBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-xs text-zinc-400 mb-6">
      <Link to="/admin" className="hover:text-zinc-200">Admin</Link>
      {segments.slice(1).map((seg, idx) => (
        <React.Fragment key={idx}>
          <span>/</span>
          <span className="capitalize text-zinc-200">{seg.replace(/-/g, ' ')}</span>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default AdminBreadcrumbs;

