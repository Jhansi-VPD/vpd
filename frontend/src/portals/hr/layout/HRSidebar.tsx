"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from 'react';
import { useLayout } from '../../../app/providers/LayoutProvider';
import { useAuth } from '../../../auth/auth.context';
import { Icon } from '../../../shared/components';

export interface HRNavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

export interface HRNavGroup {
  title: string;
  items: HRNavItem[];
}

export const hrNavGroups: HRNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/hr', icon: 'home' },
    ],
  },
  {
    title: 'Workforce & People',
    items: [
      { label: 'Employees', path: '/hr/employees', icon: 'users' },
      { label: 'Workforce Users', path: '/hr/users', icon: 'user-check' },
      { label: 'Departments', path: '/hr/departments', icon: 'grid' },
      { label: 'Recruitment (ATS)', path: '/hr/recruitment', icon: 'briefcase' },
    ],
  },
  {
    title: 'Time & Attendance',
    items: [
      { label: 'Workforce Attendance', path: '/hr/attendance', icon: 'clock' },
      { label: 'Leave Management', path: '/hr/leave', icon: 'calendar' },
      { label: 'Timesheets', path: '/hr/timesheets', icon: 'clipboard' },
    ],
  },
  {
    title: 'Finance & Talent Growth',
    items: [
      { label: 'Payroll & Payslips', path: '/hr/payroll', icon: 'wallet' },
      { label: 'Performance Reviews', path: '/hr/performance', icon: 'trending' },
      { label: 'Training & Courses', path: '/hr/training', icon: 'cap' },
      { label: 'Document Vault', path: '/hr/documents', icon: 'file' },
    ],
  },
];

export const HRSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useLayout();

  const isActive = (path: string) =>
    path === '/hr'
      ? pathname === '/hr'
      : pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0E1013] border-r border-[#1F232B] flex flex-col flex-shrink-0 h-full transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-[#1F232B] flex items-center justify-between flex-shrink-0">
          <Link href="/hr" className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#96782D] p-[1px] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0E1013] rounded-[7px] flex items-center justify-center">
                <span className="text-xs font-black text-[#EDB940] tracking-tighter">VPD</span>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold text-white tracking-wide leading-none truncate">VPD HR PORTAL</h1>
              <p className="mt-1 text-[9px] text-[#C9A84C] font-mono tracking-widest uppercase">HR Administration</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden text-[#9B9DA3] hover:text-white p-1.5 rounded-lg hover:bg-[#1A1E24] transition-colors"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        {/* Executive Portal Switcher for Admin & Super Admin */}
        {['admin', 'super_admin'].includes(String(user?.role || '').toLowerCase()) && (
          <div className="px-3 pt-3 pb-2 border-b border-[#1F232B] bg-[#0A0C0E]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5 mb-1.5">
              <span>⚡</span> Switch Portal
            </label>
            <select
              aria-label="Switch Portal"
              value="/hr"
              onChange={(e) => router.push(e.target.value)}
              className="w-full bg-[#15181D] border border-[#d4af37]/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37] font-medium cursor-pointer"
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

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-width:thin] [scrollbar-color:#1F232B_transparent]">
          {hrNavGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#C9A84C] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/70" />
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
                          ? 'bg-[#C9A84C]/15 text-[#EDB940] border border-[#C9A84C]/30 shadow-sm shadow-[#C9A84C]/10 font-semibold'
                          : 'text-[#9B9DA3] hover:text-[#F5F5F2] hover:bg-[#15181D]'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#EDB940]" />
                      )}
                      <Icon
                        name={item.icon}
                        className={`h-[18px] w-[18px] flex-shrink-0 ${
                          active ? 'text-[#EDB940]' : 'text-[#7A7D84] group-hover:text-[#F5F5F2]'
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

        {/* Status card */}
        <div className="p-3 border-t border-[#1F232B] bg-[#0A0C0E] flex-shrink-0">
          <div className="flex items-center justify-between px-2 py-2 text-[11px] text-[#7A7D84]">
            <span>FastAPI Connected</span>
            <span className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Live v1
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default HRSidebar;
