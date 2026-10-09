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
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const notifications = [
    {
      id: 'sn-1',
      title: '✉️ New Website Contact Inquiry',
      desc: 'Alexander Wright submitted a project inquiry for Apex Cloud Logistics ($180k).',
      time: '15m ago',
      href: '/sales/leads',
      tag: 'Inbound',
    },
    {
      id: 'sn-2',
      title: '✓ Proposal Accepted by Client',
      desc: 'Claire Dupont (EuroFintech SA) accepted Proposal PROP-2026-041 ($140,000).',
      time: '45m ago',
      href: '/sales/contracts',
      tag: 'Commercial',
    },
    {
      id: 'sn-3',
      title: '🤝 Contract Ready for Counter-Signature',
      desc: 'Contract CTR-2026-019 awaiting executive execution to provision Client Account.',
      time: '2h ago',
      href: '/sales/contracts',
      tag: 'Legal MSA',
    },
    {
      id: 'sn-4',
      title: '⏰ High-Priority Follow-up Due',
      desc: 'Deliver technical scoping specifications and milestone schedule to Marcus Sterling.',
      time: '4h ago',
      href: '/sales/follow-ups',
      tag: 'Action Item',
    },
  ];

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

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
        {/* Quick Pipeline Shortcut */}
        <Link
          href="/sales/pipeline"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1E] border border-zinc-800 hover:border-[#D4AF37]/50 text-xs text-zinc-300 hover:text-white transition-all"
        >
          <span className="text-[#D4AF37]">⚡</span>
          <span>Pipeline Board</span>
        </Link>

        {/* Live Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((open) => !open);
              setUnreadCount(0);
            }}
            aria-label="View commercial alerts"
            className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1C1C1E] transition-colors"
          >
            <Icon name="bell" className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#2A2A2A] bg-[#161616] shadow-2xl shadow-black/80 overflow-hidden z-50 animate-slideDown">
              <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#141414] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-[#D4AF37]">🔔</span> Commercial CRM Alerts
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Real-time inquiries, accepted proposals, and contracts</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {notifications.length} New
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setNotifOpen(false)}
                    className="p-3 hover:bg-[#1E1E1E] transition-colors block space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                        {n.title}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{n.desc}</p>
                    <span className="inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {n.tag}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="p-2 border-t border-zinc-800 bg-[#141414] text-center">
                <Link
                  href="/sales/leads"
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] text-[#D4AF37] hover:underline font-medium"
                >
                  View All Incoming Submissions ➔
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#2A2A2A]" />

        {/* User Profile Dropdown */}
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
              <span className="block text-xs font-bold text-white">{user?.name || 'Sales Lead'}</span>
              <span className="block text-[11px] font-medium text-amber-400 tracking-wide">{formatRole(user?.role)}</span>
            </span>
            <Icon
              name="chevron-down"
              className={`hidden sm:block h-3.5 w-3.5 text-zinc-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 rounded-xl border border-[#2A2A2A] bg-[#161616] shadow-2xl shadow-black/60 overflow-hidden z-50 animate-slideDown"
            >
              <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#141414]">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Sales Lead'}</p>
                {user?.email && <p className="mt-0.5 text-xs text-zinc-300 font-mono truncate">{user.email}</p>}
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
                  Leads Pipeline
                </Link>
                <Link
                  href="/sales/contracts"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <Icon name="clipboard" className="h-4 w-4 text-[#71717A]" />
                  Executed Contracts
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
