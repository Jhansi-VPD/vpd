import React from 'react';
import DataTable from '../../../../shared/components/DataTable';

export const EmployeeLifecycle: React.FC = () => {
  const events = [
    { id: '1', employee: 'Senior Developer', type: 'Probation Confirmation', date: '2026-10-01' },
    { id: '2', employee: 'QA Lead', type: 'Annual Compensation Review', date: '2026-10-05' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Employee Lifecycle & Career Milestones</h2>
        <p className="text-xs text-zinc-400">Promotions, performance evaluations, and role transitions</p>
      </div>
      <DataTable
        data={events}
        columns={[
          { header: 'Employee', accessor: 'employee' },
          { header: 'Milestone Event', accessor: 'type' },
          { header: 'Effective Date', accessor: 'date' },
        ]}
      />
    </div>
  );
};

export default EmployeeLifecycle;
