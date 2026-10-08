"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';

export const EmployeeBreadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs text-zinc-400">
      <Link href="/employee" className="hover:text-zinc-200">Workspace</Link>
      {segments.slice(1).map((seg, idx) => (
        <React.Fragment key={idx}>
          <span>/</span>
          <span className="capitalize text-zinc-200">{seg.replace(/-/g, ' ')}</span>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default EmployeeBreadcrumbs;
