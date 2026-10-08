import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';
import { useLayout } from '../../../app/providers/LayoutProvider';

const adminNav = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Organization', path: '/admin/organization' },
  { label: 'Workforce Users', path: '/admin/users' },
  { label: 'Employees', path: '/admin/employees' },
  { label: 'Departments', path: '/admin/departments' },
  { label: 'Roles & Permissions', path: '/admin/roles-permissions' },
  { label: 'Active Sessions', path: '/admin/sessions' },
  { label: 'Attendance Logs', path: '/admin/attendance' },
  { label: 'Leave Approvals', path: '/admin/leave-management' },
  { label: 'Projects', path: '/admin/projects' },
  { label: 'Tasks', path: '/admin/tasks' },
  { label: 'Timesheets', path: '/admin/timesheets' },
  { label: 'Documents', path: '/admin/documents' },
  { label: 'Announcements', path: '/admin/announcements' },
  { label: 'Reports', path: '/admin/reports' },
  { label: 'Finance (Restricted)', path: '/admin/finance' },
  { label: 'Integrations', path: '/admin/integrations' },
  { label: 'Notifications', path: '/admin/notifications' },
  { label: 'Audit Logs', path: '/admin/audit-logs' },
  { label: 'System Settings', path: '/admin/settings' },
  { label: 'Disaster Recovery', path: '/admin/backups' },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useLayout();

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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#141414] border-r border-[#2A2A2A] flex flex-col flex-shrink-0 h-full overflow-y-auto transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo/logo-icon.svg" alt="VPD" className="h-7 w-7" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">VPD ADMIN</h1>
              <p className="text-[10px] text-[#D4AF37] uppercase font-mono">Operations HQ</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#A1A1AA] hover:text-white p-1"
          >
            ×
          </button>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {adminNav.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-3 py-2 text-xs rounded-lg font-medium transition-colors  {(item.path === '/admin' || item.path === '/client' || item.path === '/employee' || item.path === '/hr' || item.path === '/manager' || item.path === '/sales' ? pathname === item.path : pathname.startsWith(item.path)) ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-[#A1A1AA] hover:text-white hover:bg-[#262626]'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
