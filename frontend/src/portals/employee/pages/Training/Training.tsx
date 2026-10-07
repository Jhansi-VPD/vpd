import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Training: React.FC = () => {
  const courses = [
    { id: '1', name: 'SOC 2 & Security Compliance Training', deadline: '2026-10-30', status: 'completed' },
    { id: '2', name: 'Advanced Cloud Architecture with AWS & Supabase', deadline: '2026-11-20', status: 'in_progress' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Continuous Learning & Professional Training</h2>
        <p className="text-xs text-zinc-400">Assigned certification courses, security tests, and skill modules</p>
      </div>
      <DataTable
        data={courses}
        columns={[
          { header: 'Training Course', accessor: 'name' },
          { header: 'Completion Target', accessor: 'deadline' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Training;
