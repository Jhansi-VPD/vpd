"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../auth/auth.context';
import { useLayout } from '../../../app/providers/LayoutProvider';
import { Icon } from '../../../shared/components';
import { salesNavGroups } from './SalesSidebar';

const formatRole = (role?: string | null) =>
  String(role || 'sales').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const initialsOf = (name?: string | null) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SC';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

const pageTitleFor = (pathname: string) => {
  const match = salesNavGroups
    .flatMap((group) => group.items)
    .filter((item) =>
      item.path === '/sales'
        ? pathname === '/sales'
        : pathname === item.path || pathname.startsWith(`${item.path}/`)
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.label || 'Dashboard';
};

export const SalesHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayout();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="h-16 border-b border-[#2A2A2A] bg-[#141414]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#262626] transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{pageTitleFor(pathname)}</p>
          <p className="text-xs text-[#D4AF37] font-medium tracking-wide truncate">
            Commercial CRM Engine · VPD Technologies
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <div className="hidden sm:block h-6 w-px bg-[#2A2A2A]" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 rounded-xl px-1.5 sm:px-2 py-1.5 hover:bg-[#1D1D1D] transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-[11px] font-bold text-black">
              {initialsOf(user?.name)}
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-xs font-semibold text-white">{user?.name || 'Sales Officer'}</span>
              <span className="block text-[10px] text-[#71717A]">{formatRole(user?.role)}</span>
            </span>
            <Icon
              name="chevron-down"
              className={`hidden sm:block h-3.5 w-3.5 text-[#71717A] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 rounded-xl border border-[#2A2A2A] bg-[#161616] shadow-2xl shadow-black/60 overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#141414]">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Sales Officer'}</p>
                {user?.email && <p className="mt-0.5 text-[10px] text-[#71717A] truncate">{user.email}</p>}
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                  <Icon name="shield" className="h-3 w-3" />
                  {formatRole(user?.role)}
                </span>
              </div>
              <div className="p-1.5">
                <Link
                  href="/sales/pipeline"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <Icon name="grid" className="h-4 w-4 text-[#71717A]" />
                  Deal Pipeline
                </Link>
                <Link
                  href="/sales/leads"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <Icon name="users" className="h-4 w-4 text-[#71717A]" />
                  Leads
                </Link>
                <div className="my-1.5 h-px bg-[#2A2A2A]" />
                <button
                  role="menuitem"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SalesHeader;
