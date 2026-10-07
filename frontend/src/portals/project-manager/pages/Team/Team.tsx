import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Team: React.FC = () => {
  const members = [
    { id: '1', name: 'Alex Mercer', role: 'Fullstack Lead Engineer', allocation: '100%', status: 'active' },
    { id: '2', name: 'Samantha Vance', role: 'Principal Architect', allocation: '50%', status: 'active' },
    { id: '3', name: 'Jonathan Reed', role: 'DevOps / SRE Lead', allocation: '100%', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Engineering Project Team</h2>
        <p className="text-xs text-zinc-400">Assigned software engineers, cloud architects, and QA specialists</p>
      </div>
      <DataTable
        data={members}
        columns={[
          { header: 'Engineer Name', accessor: 'name' },
          { header: 'Project Role', accessor: 'role' },
          { header: 'Sprint Allocation', accessor: (row) => <StatusBadge status={row.allocation} variant="gold" /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Team;
