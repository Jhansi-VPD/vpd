import React from 'react';
import { useAuth } from '../../../auth/auth.context';
import { useLayout } from '../../../app/providers/LayoutProvider';
import Button from '../../../shared/components/Button';

export const EmployeeHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayout();

  return (
    <header className="h-16 border-b border-[#2A2A2A] bg-[#141414]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#262626]"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
          Active Session: {user?.role || 'Staff Member'}
        </span>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-white">{user?.name || 'Employee'}</p>
          <p className="text-[10px] text-[#A1A1AA]">{user?.email}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => logout()}>
          Sign Out
        </Button>
      </div>
    </header>
  );
};

export default EmployeeHeader;

