"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';
import { useLayout } from '../../../app/providers/LayoutProvider';
import { Icon } from '../../../shared/components';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: 'home' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Organization', path: '/admin/organization', icon: 'building' },
      { label: 'Workforce Users', path: '/admin/users', icon: 'users' },
      { label: 'Employees', path: '/admin/employees', icon: 'user-check' },
      { label: 'Departments', path: '/admin/departments', icon: 'grid' },
      { label: 'Roles & Permissions', path: '/admin/roles-permissions', icon: 'shield' },
    ],
  },
  {
    title: 'Workforce Ops',
    items: [
      { label: 'Active Sessions', path: '/admin/sessions', icon: 'monitor' },
      { label: 'Attendance Logs', path: '/admin/attendance', icon: 'clock' },
      { label: 'Leave Approvals', path: '/admin/leave-management', icon: 'calendar' },
    ],
  },
  {
    title: 'Delivery',
    items: [
      { label: 'Projects', path: '/admin/projects', icon: 'folder' },
      { label: 'Tasks', path: '/admin/tasks', icon: 'check' },
      { label: 'Timesheets', path: '/admin/timesheets', icon: 'clipboard' },
      { label: 'Documents', path: '/admin/documents', icon: 'file' },
      { label: 'Announcements', path: '/admin/announcements', icon: 'megaphone' },
    ],
  },
  {
    title: 'Insights & Finance',
    items: [
      { label: 'Reports', path: '/admin/reports', icon: 'chart' },
      { label: 'Finance (Restricted)', path: '/admin/finance', icon: 'dollar' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Integrations', path: '/admin/integrations', icon: 'link' },
      { label: 'Notifications', path: '/admin/notifications', icon: 'bell' },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'list' },
      { label: 'System Settings', path: '/admin/settings', icon: 'settings' },
      { label: 'Disaster Recovery', path: '/admin/backups', icon: 'database' },
    ],
  },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useLayout();

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
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
        <div className="h-16 px-4 border-b border-[#2A2A2A] flex items-center justify-between flex-shrink-0">
          <Link href="/admin" className="flex items-center space-x-2.5 min-w-0">
            <img src="/logo/logo-icon.svg" alt="VPD" className="h-8 w-8" />
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold text-white tracking-wide leading-none truncate">VPD Admin</h1>
              <p className="mt-1 text-[9px] text-[#D4AF37] uppercase font-semibold tracking-[0.18em]">Operations HQ</p>
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

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-width:thin] [scrollbar-color:#2a2a2a_transparent]">
          {adminNavGroups.map((group) => (
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
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 ${
                        active
                          ? 'bg-[#D4AF37]/10 text-[#F0D67C]'
                          : 'text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E]'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#D4AF37]" />
                      )}
                      <Icon
                        name={item.icon}
                        className={`h-[18px] w-[18px] flex-shrink-0 ${
                          active ? 'text-[#D4AF37]' : 'text-[#71717A] group-hover:text-[#A1A1AA]'
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

        <div className="p-3 border-t border-[#2A2A2A] flex-shrink-0">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-[10px] font-semibold text-white">All systems operational</p>
            </div>
            <p className="mt-1 text-[10px] text-[#71717A] font-mono">VPD Core · Production</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
