"use client";
import React from 'react';

import EmployeeSidebar from './EmployeeSidebar';
import EmployeeHeader from './EmployeeHeader';
import EmployeeBreadcrumbs from './EmployeeBreadcrumbs';

export const EmployeeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-[#111111] text-white overflow-hidden">
      <EmployeeSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <EmployeeHeader />
        <main className="flex-1 overflow-y-auto bg-[#111111]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            <EmployeeBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;

