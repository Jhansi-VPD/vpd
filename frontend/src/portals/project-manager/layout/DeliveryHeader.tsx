"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../auth/auth.context';
import { useLayout } from '../../../app/providers/LayoutProvider';
import { Icon } from '../../../shared/components';
import { deliveryNavGroups } from './DeliverySidebar';

const formatRole = (role?: string | null) =>
  String(role || 'project_manager').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const initialsOf = (name?: string | null) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PM';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

const pageTitleFor = (pathname: string) => {
  const match = deliveryNavGroups
    .flatMap((group) => group.items)
    .filter((item) =>
      item.path === '/delivery'
        ? pathname === '/delivery'
        : pathname === item.path || pathname.startsWith(`${item.path}/`)
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.label || 'Dashboard';
};

export const DeliveryHeader: React.FC = () => {
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
      id: 'n-1',
      title: '🐞 Bug Fixed ➔ Ready for Retest',
      desc: 'Alex Mercer resolved the OAuth2 PKCE callback issue on Core Banking.',
      time: '12m ago',
      href: '/delivery/tasks',
      tag: 'QA Cycle',
    },
    {
      id: 'n-2',
      title: '✓ Dev Complete Handover',
      desc: 'Rahul Sharma submitted Payment Gateway Webhook Retry task to QA.',
      time: '34m ago',
      href: '/delivery/tasks',
      tag: 'Sprint 14',
    },
    {
      id: 'n-3',
      title: '📋 New Workforce Timesheets',
      desc: '2 billable timesheet entries awaiting PM manager approval.',
      time: '1h ago',
      href: '/delivery/timesheets',
      tag: 'Timesheets',
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
            Project Manager Hub · VPD Technologies
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Assign Task Action */}
        <Link
          href="/delivery/tasks"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          <span>⚡</span>
          <span>+ Assign Task</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setMenuOpen(false);
            }}
            aria-label="Delivery Notifications"
            className="relative p-2 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#262626] transition-colors"
          >
            <Icon name="bell" className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#2A2A2A] bg-[#161616] shadow-2xl shadow-black/80 overflow-hidden z-50 animate-scaleIn">
              <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Delivery Activity & QA Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[10px] text-zinc-400 hover:text-amber-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#222222] max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setNotifOpen(false)}
                    className="p-3 block hover:bg-[#1C1C1C] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {n.tag}
                      </span>
                      <span className="text-[10px] text-zinc-500">{n.time}</span>
                    </div>
                    <p className="text-xs font-semibold text-white mt-1">{n.title}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.desc}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="p-2 border-t border-[#2A2A2A] bg-[#121212] text-center">
                <Link
                  href="/delivery/tasks"
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View Sprint Kanban Board ➔
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#2A2A2A]" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen((open) => !open);
              setNotifOpen(false);
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 rounded-xl px-1.5 sm:px-2 py-1.5 hover:bg-[#1D1D1D] transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-[11px] font-bold text-black">
              {initialsOf(user?.name)}
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-xs font-bold text-white">{user?.name || 'Project Manager'}</span>
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
              className="absolute right-0 mt-2 w-60 rounded-xl border border-[#2A2A2A] bg-[#161616] shadow-2xl shadow-black/60 overflow-hidden z-50 animate-scaleIn"
            >
              <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#141414]">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Project Manager'}</p>
                {user?.email && <p className="mt-0.5 text-xs text-zinc-300 font-mono truncate">{user.email}</p>}
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                  <Icon name="shield" className="h-3 w-3" />
                  {formatRole(user?.role)}
                </span>
              </div>
              <div className="p-1.5">
                <Link
                  href="/delivery/timesheets"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <Icon name="clock" className="h-4 w-4 text-[#71717A]" />
                  Timesheets
                </Link>
                <Link
                  href="/delivery/tasks"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E] transition-colors"
                >
                  <Icon name="check" className="h-4 w-4 text-[#71717A]" />
                  Tasks (Kanban)
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

export default DeliveryHeader;
