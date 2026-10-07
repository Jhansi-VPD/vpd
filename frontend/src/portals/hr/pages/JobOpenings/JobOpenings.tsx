import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const JobOpenings: React.FC = () => {
  const jobs = [
    { id: '1', title: 'Senior Cloud Solutions Architect', dept: 'Engineering', applicants: 14, status: 'active' },
    { id: '2', title: 'Fullstack React/Python Engineer', dept: 'Engineering', applicants: 28, status: 'active' },
    { id: '3', title: 'Enterprise Account Executive', dept: 'Sales', applicants: 9, status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Open Career Positions</h2>
        <p className="text-xs text-zinc-400">Manage internal hiring campaigns and active requisitions</p>
      </div>
      <DataTable
        data={jobs}
        columns={[
          { header: 'Position Title', accessor: 'title' },
          { header: 'Department', accessor: 'dept' },
          { header: 'Candidates', accessor: (row) => `${row.applicants} In Review` },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default JobOpenings;
