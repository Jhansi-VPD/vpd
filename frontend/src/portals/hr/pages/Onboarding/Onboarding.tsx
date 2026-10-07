import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Onboarding: React.FC = () => {
  const cohort = [
    { id: '1', name: 'Jonathan Reed', role: 'DevOps Engineer', startDate: '2026-10-12', progress: '85%' },
    { id: '2', name: 'Elena Rostova', role: 'Frontend Specialist', startDate: '2026-10-19', progress: '20%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Employee Onboarding Pipeline</h2>
        <p className="text-xs text-zinc-400">IT provisioning, compliance paperwork, and orientation checklists</p>
      </div>
      <DataTable
        data={cohort}
        columns={[
          { header: 'New Hire', accessor: 'name' },
          { header: 'Role', accessor: 'role' },
          { header: 'Start Date', accessor: 'startDate' },
          { header: 'Checklist Completion', accessor: (row) => <StatusBadge status={row.progress} variant="gold" /> },
        ]}
      />
    </div>
  );
};

export default Onboarding;
