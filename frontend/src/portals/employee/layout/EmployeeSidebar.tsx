"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';
import { useLayout } from '../../../app/providers/LayoutProvider';
import { Icon } from '../../../shared/components';

export interface EmployeeNavItem {
  label: string;
  path: string;
  icon: string;
}

export interface EmployeeNavGroup {
  title: string;
  items: EmployeeNavItem[];
}

export const employeeNavGroups: EmployeeNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'My Dashboard', path: '/employee', icon: 'home' },
    ],
  },
  {
    title: 'Time & Attendance',
    items: [
      { label: 'Attendance Clock', path: '/employee/attendance', icon: 'clock' },
      { label: 'Apply Leave', path: '/employee/leave', icon: 'calendar' },
      { label: 'Timesheet Logger', path: '/employee/timesheets', icon: 'clipboard' },
    ],
  },
  {
    title: 'My Work',
    items: [
      { label: 'My Tasks', path: '/employee/my-tasks', icon: 'check' },
      { label: 'My Projects', path: '/employee/my-projects', icon: 'folder' },
    ],
  },
  {
    title: 'Personal',
    items: [
      { label: 'My Profile', path: '/employee/my-profile', icon: 'user' },
      { label: 'My Documents', path: '/employee/documents', icon: 'file' },
      { label: 'Payslips & Comp', path: '/employee/payslips', icon: 'wallet' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Training & Skills', path: '/employee/training', icon: 'cap' },
      { label: 'Performance Review', path: '/employee/performance', icon: 'trending' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Announcements', path: '/employee/announcements', icon: 'megaphone' },
      { label: 'Notifications', path: '/employee/notifications', icon: 'bell' },
    ],
  },
];

export const EmployeeSidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useLayout();

  const isActive = (path: string) =>
    path === '/employee' ? pathname === '/employee' : pathname === path || pathname.startsWith(`${path}/`);

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
          <Link href="/employee" className="flex items-center space-x-2.5 min-w-0">
            <img src="/logo/logo-icon.svg" alt="VPD" className="h-8 w-8" />
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold text-white tracking-wide leading-none truncate">My Workspace</h1>
              <p className="mt-1 text-[9px] text-[#D4AF37] uppercase font-semibold tracking-[0.18em]">Employee Portal</p>
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
          {employeeNavGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52525B]">
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

        <div className="px-4 py-3 border-t border-[#2A2A2A] flex-shrink-0">
          <p className="text-[10px] text-[#52525B]">VPD Technologies · Employee Portal</p>
        </div>
      </aside>
    </>
  );
};

export default EmployeeSidebar;
