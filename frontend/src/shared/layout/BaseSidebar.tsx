"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from 'react';
import { useLayout } from '../../app/providers/LayoutProvider';
import { useAuth } from '../../auth/auth.context';
import { Icon } from '../components';

export interface BaseNavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

export interface BaseNavGroup {
  title: string;
  items: BaseNavItem[];
}

export interface BaseSidebarProps {
  portalKey: string;
  portalName: string;
  portalSubtitle: string;
  navGroups: BaseNavGroup[];
  statusTitle?: string;
  statusSubtitle?: string;
}

export const BaseSidebar: React.FC<BaseSidebarProps> = ({
  portalKey,
  portalName,
  portalSubtitle,
  navGroups,
  statusTitle = 'Platform Nominal',
  statusSubtitle = 'Systems Online',
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useLayout();

  const isActive = (path: string) =>
    path === portalKey
      ? pathname === portalKey
      : pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#141414] border-r border-[#2A2A2A] flex flex-col flex-shrink-0 h-full transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#2A2A2A] flex items-center justify-between flex-shrink-0">
          <Link href={portalKey} className="flex items-center space-x-2.5 min-w-0">
            <img src="/logo/logo-icon.svg" alt="VPD" className="h-8 w-8" />
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold text-white tracking-wide leading-none truncate">
                {portalName}
              </h1>
              <p className="mt-1 text-[9px] text-[#D4AF37] uppercase font-semibold tracking-[0.18em]">
                {portalSubtitle}
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden text-[#A1A1AA] hover:text-white p-1.5 rounded-lg hover:bg-[#262626] transition-colors"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        {/* Executive Portal Switcher for Admin & Super Admin */}
        {['admin', 'super_admin'].includes(String(user?.role || '').toLowerCase()) && (
          <div className="px-3 pt-3 pb-2 border-b border-[#2A2A2A] bg-[#101010]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5 mb-1.5">
              <span>⚡</span> Switch Portal
            </label>
            <select
              aria-label="Switch Portal"
              value={portalKey}
              onChange={(e) => router.push(e.target.value)}
              className="w-full bg-[#181818] border border-[#d4af37]/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37] font-medium cursor-pointer"
            >
              <option value="/admin">👑 Admin & Executive</option>
              <option value="/hr">👥 HR & Workforce</option>
              <option value="/delivery">📁 Delivery & Projects</option>
              <option value="/sales">💼 Sales & CRM</option>
              <option value="/employee">👤 Employee Portal</option>
              <option value="/client">🏢 Client Portal</option>
            </select>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-width:thin] [scrollbar-color:#2a2a2a_transparent]">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/70" />
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 ${
                        active
                          ? 'bg-[#D4AF37]/15 text-[#F0D67C] font-semibold'
                          : 'text-zinc-300 hover:text-white hover:bg-[#1E1E1E]'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#D4AF37]" />
                      )}
                      <Icon
                        name={item.icon}
                        className={`h-[18px] w-[18px] flex-shrink-0 ${
                          active ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Status Card */}
        <div className="p-3 border-t border-[#2A2A2A] flex-shrink-0">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-semibold text-white">{statusTitle}</p>
            </div>
            <p className="mt-1 text-xs text-zinc-300 font-mono">{statusSubtitle}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default BaseSidebar;
