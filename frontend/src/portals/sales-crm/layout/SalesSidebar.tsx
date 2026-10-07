import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLayout } from '../../../app/providers/LayoutProvider';

const salesNav = [
  { label: 'Dashboard', path: '/sales' },
  { label: 'Leads', path: '/sales/leads' },
  { label: 'Opportunities', path: '/sales/opportunities' },
  { label: 'Deal Pipeline', path: '/sales/pipeline' },
  { label: 'Proposals', path: '/sales/proposals' },
  { label: 'Contracts', path: '/sales/contracts' },
  { label: 'Activities', path: '/sales/activities' },
  { label: 'Follow-ups', path: '/sales/follow-ups' },
  { label: 'Client Accounts', path: '/sales/clients' },
  { label: 'Sales Reports', path: '/sales/reports' },
];

export const SalesSidebar: React.FC = () => {
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
              <h1 className="text-sm font-bold text-white tracking-wide">VPD CRM</h1>
              <p className="text-[10px] text-[#D4AF37] uppercase font-mono">Revenue Engine</p>
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
          {salesNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/sales'}
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

export default SalesSidebar;

