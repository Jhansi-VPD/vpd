import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLayout } from '../../../app/providers/LayoutProvider';

interface NavItem {
  label: string;
  path: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

const hrNav: NavItem[] = [
  {
    label: 'Dashboard & Attendance',
    path: '/hr',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Employees',
    path: '/hr/employees',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Departments',
    path: '/hr/departments',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Attendance',
    path: '/hr/attendance',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Leave Management',
    path: '/hr/leave',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Timesheets',
    path: '/hr/timesheets',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Payroll & Payslips',
    path: '/hr/payroll',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Performance & Goals',
    path: '/hr/performance',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'Training & Courses',
    path: '/hr/training',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
  {
    label: 'Recruitment (ATS)',
    path: '/hr/recruitment',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Document Vault',
    path: '/hr/documents',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export const HRSidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useLayout();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0E1013] border-r border-[#1F232B] flex flex-col flex-shrink-0 h-full overflow-y-auto transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-[#1F232B] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#96782D] p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0E1013] rounded-[7px] flex items-center justify-center">
                <span className="text-xs font-black text-[#EDB940] tracking-tighter">VPD</span>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                VPD HR PORTAL
              </h1>
              <p className="text-[10px] text-[#C9A84C] font-mono tracking-widest uppercase">HR Administration</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#9B9DA3] hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {hrNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/hr'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-[#C9A84C]/15 text-[#EDB940] border border-[#C9A84C]/40 shadow-sm shadow-[#C9A84C]/10 font-semibold'
                    : 'text-[#9B9DA3] hover:text-[#F5F5F2] hover:bg-[#15181D]'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0 opacity-90" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1F232B] bg-[#0A0C0E]">
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
