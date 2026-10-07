import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLayout } from '../../../app/providers/LayoutProvider';

const hrNav = [
  { label: 'Dashboard', path: '/hr' },
  { label: 'Job Openings', path: '/hr/job-openings' },
  { label: 'Candidates', path: '/hr/candidates' },
  { label: 'Interviews', path: '/hr/interviews' },
  { label: 'Onboarding', path: '/hr/onboarding' },
  { label: 'Employee Records', path: '/hr/employee-records' },
  { label: 'Attendance', path: '/hr/attendance' },
  { label: 'Leave Requests', path: '/hr/leave' },
  { label: 'HR Documents', path: '/hr/documents' },
  { label: 'Employee Lifecycle', path: '/hr/employee-lifecycle' },
  { label: 'Talent Reports', path: '/hr/reports' },
];

export const HRSidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useLayout();

  return (
    <>
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
              <h1 className="text-sm font-bold text-white tracking-wide">VPD HR</h1>
              <p className="text-[10px] text-[#D4AF37] uppercase font-mono">Talent & People Ops</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#A1A1AA] hover:text-white p-1"
          >
            ✕
          </button>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {hrNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/hr'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#262626]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default HRSidebar;

