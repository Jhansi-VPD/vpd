"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React from 'react';


export const AdminBreadcrumbs: React.FC = () => {
  const location = { pathname: usePathname() };
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-xs text-zinc-400 mb-6">
      <Link href="/admin" className="hover:text-zinc-200">Admin</Link>
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

